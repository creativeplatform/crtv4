import { useCallback } from "react";
import { useCapacityCredits } from "./useCapacityCredits";
import { usePKPSigning } from "./usePKPSigning";
import { z } from "zod";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {
  LIT_NETWORK,
  LIT_ABILITY,
  AUTH_METHOD_TYPE,
} from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import { getSigner } from "@account-kit/core";
import { config } from "@/config";
import type { AuthCallback, AuthCallbackParams } from "@lit-protocol/types";

const DelegatedSignParamsSchema = z.object({
  message: z.string(),
  pkpInfo: z.object({
    tokenId: z.string(),
    publicKey: z.string(),
    ethAddress: z.string(),
  }),
  capacityTokenId: z.string(),
  sigName: z.string().optional(),
  maxUses: z.number().optional().default(1),
});

export type DelegatedSignParams = z.infer<typeof DelegatedSignParamsSchema>;

export interface DelegatedSignResult {
  success: boolean;
  signatures?: any;
  error?: string;
}

export function usePKPDelegatedSigning() {
  const { delegateCapacity } = useCapacityCredits();
  const { signWithPKP } = usePKPSigning();

  const signWithDelegation = useCallback(
    async ({
      message,
      pkpInfo,
      capacityTokenId,
      sigName = "sig1",
      maxUses = 1,
    }: DelegatedSignParams): Promise<DelegatedSignResult> => {
      try {
        // Step 1: Initialize Lit Node Client
        const litNodeClient = new LitNodeClient({
          litNetwork: LIT_NETWORK.Datil,
          debug: false,
        });
        await litNodeClient.connect();

        // Step 2: Delegate capacity with numeric uses parameter
        const { capacityDelegationAuthSig, error: delegationError } =
          await delegateCapacity({
            uses: maxUses.toString(),
            capacityTokenId,
            pkpInfo,
          });

        if (delegationError || !capacityDelegationAuthSig) {
          throw new Error(
            delegationError || "Failed to obtain capacity delegation signature"
          );
        }

        console.log("Capacity delegation auth sig:", {
          hasSignature: !!capacityDelegationAuthSig?.sig,
          signatureStart: capacityDelegationAuthSig?.sig?.slice(0, 10),
          fullAuthSig: capacityDelegationAuthSig,
        });

        // Step 3: Create PKP auth method from delegation
        const pkpAuthMethod = {
          authMethodType: AUTH_METHOD_TYPE.EthWallet,
          accessToken: JSON.stringify({
            sig: capacityDelegationAuthSig.sig,
            derivedVia: capacityDelegationAuthSig.derivedVia,
            signedMessage: capacityDelegationAuthSig.signedMessage,
            address: capacityDelegationAuthSig.address,
          }),
        };

        console.log("PKP auth method created:", {
          type: pkpAuthMethod.authMethodType,
          hasAccessToken: !!pkpAuthMethod.accessToken,
        });

        // Step 4: Create the auth callback using the recommended pattern
        const pkpAuthNeededCallback: AuthCallback = async ({
          expiration,
          resources,
          resourceAbilityRequests,
        }: AuthCallbackParams) => {
          if (!expiration || !resources || !resourceAbilityRequests) {
            throw new Error("Missing required auth parameters");
          }

          try {
            console.log("Auth callback params:", {
              expiration,
              resourceCount: resources.length,
              requestCount: resourceAbilityRequests.length,
            });

            const response = await litNodeClient.signSessionKey({
              statement: "Sign in with Ethereum to use Lit Protocol",
              authMethods: [pkpAuthMethod],
              pkpPublicKey: pkpInfo.publicKey,
              expiration,
              resources,
              chainId: 1,
              resourceAbilityRequests,
            });

            console.log("Session key signature response:", {
              hasAuthSig: !!response?.authSig,
              authSigKeys: response?.authSig
                ? Object.keys(response.authSig)
                : [],
              fullResponse: response,
            });

            if (!response?.authSig) {
              throw new Error("Failed to obtain session key signature");
            }

            return response.authSig;
          } catch (error) {
            console.error("PKP auth callback failed:", {
              error,
              message: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
          }
        };

        // Step 5: Get session signatures with PKP auth
        const sessionSigs = await litNodeClient.getSessionSigs({
          pkpPublicKey: pkpInfo.publicKey,
          expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          chain: "ethereum",
          resourceAbilityRequests: [
            {
              resource: new LitPKPResource("*"),
              ability: LIT_ABILITY.PKPSigning,
            },
          ],
          authNeededCallback: pkpAuthNeededCallback,
          capacityDelegationAuthSig,
        });

        console.log("Session signatures obtained:", {
          hasSessionSigs: !!sessionSigs,
          sessionSigKeys: Object.keys(sessionSigs),
          fullSessionSigs: sessionSigs,
        });

        // Step 6: Sign the message using PKP with session signatures
        const signResult = await signWithPKP({
          message,
          publicKey: pkpInfo.publicKey,
          sigName,
          authSig: sessionSigs,
          litActionCode: `
const go = async () => {
  const messageToSign = typeof toSign === 'string' ? 
    ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(toSign))) :
    toSign;
    
  const sigShare = await LitActions.signEcdsa({ 
    toSign: messageToSign,
    publicKey, 
    sigName,
    shouldHashMessage: true,
    sigType: "ethereum",
  });
  return sigShare;
};
go();
`,
        });

        console.log("PKP signing result:", {
          success: signResult.success,
          hasSignatures: !!signResult.signatures,
          error: signResult.error,
          fullResult: signResult,
        });

        return {
          success: signResult.success,
          signatures: signResult.signatures,
          error: signResult.error,
        };
      } catch (error) {
        console.error("PKP delegated signing failed:", {
          error,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        return {
          success: false,
          error: `Failed to sign with delegated PKP: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    [delegateCapacity, signWithPKP]
  );

  return {
    signWithDelegation,
  };
}
