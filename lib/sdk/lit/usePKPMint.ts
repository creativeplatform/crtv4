import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from "@lit-protocol/constants";
import { useCallback } from "react";
import useModularAccount from "@/lib/hooks/useModularAccount";
import { useSessionSigs } from "./sessionSigs";
import { getContractClient } from "./lit-contracts";
import { getAuthIdByAuthMethod } from "@lit-protocol/lit-auth-client";
import { useUser } from "@account-kit/react";
import { fromHex } from "viem";
import type { AuthMethod } from "@lit-protocol/types";

export interface PKPMintInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

export interface PKPMintResult {
  pkp: PKPMintInfo;
  tx: any; // Transaction receipt from the blockchain
}

export function usePKPMint() {
  const { smartAccountClient: client } = useModularAccount();
  const { getSessionSigs } = useSessionSigs();
  const user = useUser();

  const mintPKP = useCallback(async (): Promise<PKPMintResult> => {
    console.log("Starting PKP minting process...");
    console.log("Checking prerequisites:", {
      hasClient: !!client,
      userType: user?.type,
      timestamp: new Date().toISOString(),
    });

    if (!client) throw new Error("Smart Account client not initialized");
    if (user?.type !== "sca")
      throw new Error("Lit Protocol requires a Smart Contract Account");

    try {
      console.log("Getting session signatures...");
      const sessionSigs = await getSessionSigs();
      console.log("Session signatures state:", {
        hasSessionSigs: !!sessionSigs,
        sessionSigsKeys: sessionSigs ? Object.keys(sessionSigs) : [],
        timestamp: new Date().toISOString(),
      });

      if (!sessionSigs) throw new Error("Failed to get session signatures");

      // Convert session signatures to the expected format
      const sigsArray = Object.values(sessionSigs);
      if (!sigsArray.length) throw new Error("No session signatures found");

      const firstSig = sigsArray[0];
      if (!firstSig?.signedMessage || !firstSig?.sig) {
        throw new Error("Invalid session signature format");
      }

      console.log("Session signatures obtained:", {
        type: typeof firstSig,
        hasSignature: !!firstSig.sig,
        hasSignedMessage: !!firstSig.signedMessage,
        timestamp: new Date().toISOString(),
      });

      console.log("Initializing contract client...");
      const contractClient = await getContractClient({
        signer: client,
      });
      console.log("Contract client state:", {
        hasContractClient: !!contractClient,
        timestamp: new Date().toISOString(),
      });

      console.log("Getting auth ID...");
      const authMethod: AuthMethod = {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: JSON.stringify({
          signedMessage: firstSig.signedMessage,
          sig: firstSig.sig.startsWith("0x")
            ? firstSig.sig
            : `0x${firstSig.sig}`,
        }),
      };

      const authIdBytes = await getAuthIdByAuthMethod(authMethod);
      console.log("Auth ID state:", {
        hasAuthIdBytes: !!authIdBytes,
        authIdBytesLength: authIdBytes?.length,
        timestamp: new Date().toISOString(),
      });

      console.log("Minting PKP with auth...");
      const mintInfo = await contractClient.mintWithAuth({
        authMethod: {
          authMethodType: AUTH_METHOD_TYPE.EthWallet,
          accessToken: authMethod.accessToken,
        },
        scopes: [
          AUTH_METHOD_SCOPE.SignAnything,
          AUTH_METHOD_SCOPE.PersonalSign,
        ],
      });
      console.log("PKP minted successfully:", {
        ...mintInfo,
        timestamp: new Date().toISOString(),
      });

      console.log("Waiting for blockchain confirmation...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Verifying PKP scopes...");
      const scopes =
        await contractClient.pkpPermissionsContract.read.getPermittedAuthMethodScopes(
          mintInfo.pkp.tokenId,
          AUTH_METHOD_TYPE.EthWallet,
          authIdBytes,
          3
        );
      console.log("PKP scopes verified:", {
        scopes,
        timestamp: new Date().toISOString(),
      });

      const signAnythingScope = scopes[1];
      const personalSignScope = scopes[2];

      if (!signAnythingScope || !personalSignScope) {
        throw new Error("PKP minted but scopes not set correctly");
      }

      return mintInfo;
    } catch (error) {
      console.error("Detailed PKP Minting error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(
        `Failed to mint PKP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [client, user?.type, getSessionSigs]);

  return {
    mintPKP,
  };
}
