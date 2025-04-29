/**
 * @file usePKPDelegatedSigning.ts
 * @description React hook for PKP (Programmable Key Pair) delegated signing operations using Lit Protocol.
 *
 * This hook enables an advanced Lit Protocol capability where:
 * - Users can delegate signing authority to another entity using capacity credits
 * - The delegate can sign messages with the PKP without direct access to the key
 * - The delegation can be limited to a specific number of signing operations
 *
 * The process involves:
 * 1. Delegating capacity credits to the PKP
 * 2. Creating a PKP auth method from the delegation
 * 3. Establishing a session with the Lit Network using the delegation
 * 4. Signing the message with the PKP using the delegated authority
 *
 * @requires LitNodeClient from @lit-protocol/lit-node-client
 * @requires useCapacityCredits for delegating capacity to a PKP
 * @requires usePKPSigning for message signing operations
 * @requires LitPKPResource from @lit-protocol/auth-helpers for defining resource scope
 *
 * @param {DelegatedSignParams} params Object containing:
 *   - message: The message to sign
 *   - pkpInfo: Information about the PKP (tokenId, publicKey, ethAddress)
 *   - capacityTokenId: ID of the capacity token to use for delegation
 *   - sigName: Name for the signature (default: "sig1")
 *   - maxUses: Maximum number of times the delegation can be used (default: 1)
 *
 * @returns {Object} An object containing:
 *   - signWithDelegation: Function to execute the delegated signing operation
 *
 * @example
 * const { signWithDelegation } = usePKPDelegatedSigning();
 * const result = await signWithDelegation({
 *   message: "Hello, world!",
 *   pkpInfo: {
 *     tokenId: "123",
 *     publicKey: "0x...",
 *     ethAddress: "0x..."
 *   },
 *   capacityTokenId: "456",
 *   maxUses: 5
 * });
 *
 * @dev Notes:
 * - Uses the Lit Datil network by default
 * - The delegated signing process requires multiple Lit Protocol API calls
 * - Utilizes PKP signing with customizable Lit Action code for signing flexibility
 * - Implements extensive error handling and logging for debugging
 * - The auth callback pattern follows Lit Protocol's recommended implementation
 * - Capacity delegation auth signatures have a fixed expiration time (24 hours here)
 * - Resource ability requests default to 'pkp-signing' for all resources ('*')
 * - The signing operation uses ethers.utils to prepare the message for signing
 */

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
