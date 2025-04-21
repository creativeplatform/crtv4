import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from "@lit-protocol/constants";
import { useCallback } from "react";
import useModularAccount from "@/lib/hooks/useModularAccount";
import { useSessionSigs } from "./sessionSigs";
import { getContractClient } from "./lit-contracts";
import { getAuthIdByAuthMethod } from "@lit-protocol/lit-auth-client";

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
  const { getSessionSigs, isReady } = useSessionSigs();

  const mintPKP = useCallback(async (): Promise<PKPMintResult> => {
    if (!client || !isReady) throw new Error("Client not initialized");

    try {
      const sessionSigs = await getSessionSigs();
      const contractClient = await getContractClient();

      const authMethod = {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: JSON.stringify(sessionSigs),
      };

      // Mint PKP with auth and set scopes
      const mintInfo = await contractClient.mintWithAuth({
        authMethod,
        scopes: [
          AUTH_METHOD_SCOPE.SignAnything,
          AUTH_METHOD_SCOPE.PersonalSign,
        ],
      });

      // Verify permissions were set correctly
      const authId = await getAuthIdByAuthMethod(authMethod);

      // Wait for a block to be mined before reading scopes
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const scopes =
        await contractClient.pkpPermissionsContract.read.getPermittedAuthMethodScopes(
          mintInfo.pkp.tokenId,
          AUTH_METHOD_TYPE.EthWallet,
          authId,
          3
        );

      const signAnythingScope = scopes[1];
      const personalSignScope = scopes[2];

      if (!signAnythingScope || !personalSignScope) {
        throw new Error("PKP minted but scopes not set correctly");
      }

      return mintInfo;
    } catch (error) {
      throw new Error(
        `Failed to mint PKP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [client, isReady, getSessionSigs]);

  return {
    mintPKP,
    isReady: isReady && !!client,
  };
}
