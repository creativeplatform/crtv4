import { useCallback } from "react";
import { useLitContext } from "./LitContext";
import useModularAccount from "@/lib/hooks/useModularAccount";
import { getContractClient } from "./lit-contracts";
import { useUser } from "@account-kit/react";
import { AUTH_METHOD_TYPE, AUTH_METHOD_SCOPE } from "@lit-protocol/constants";

export interface PKPMintInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

interface PKPMintResult {
  success: boolean;
  pkp: PKPMintInfo | null;
  error?: string;
}

export function usePKPMint() {
  const { smartAccountClient: client } = useModularAccount();
  const { pkp, setPKP } = useLitContext();
  const user = useUser();

  const mintPKP = useCallback(async (): Promise<PKPMintResult> => {
    try {
      if (!client) {
        throw new Error("Smart account client not initialized");
      }

      if (!user?.type || user.type !== "sca") {
        throw new Error("Smart Contract Account required for PKP minting");
      }

      // Initialize contract client
      const contractClient = await getContractClient();
      if (!contractClient) {
        throw new Error("Failed to initialize contract client");
      }

      // Mint PKP
      const { pkp: mintedPkp } = await contractClient.mintWithAuth({
        authMethod: {
          authMethodType: AUTH_METHOD_TYPE.EthWallet,
          accessToken: JSON.stringify({
            pkp: pkp,
          }),
        },
        scopes: [AUTH_METHOD_SCOPE.SignAnything],
      });

      if (!mintedPkp.tokenId || !mintedPkp.publicKey || !mintedPkp.ethAddress) {
        throw new Error("Failed to mint PKP - missing required data");
      }

      const pkpInfo = {
        tokenId: mintedPkp.tokenId,
        publicKey: mintedPkp.publicKey,
        ethAddress: mintedPkp.ethAddress,
      };

      // Update context
      setPKP(pkpInfo);

      return {
        success: true,
        pkp: pkpInfo,
      };
    } catch (error) {
      console.error("Failed to mint PKP:", error);
      return {
        success: false,
        pkp: null,
        error: error instanceof Error ? error.message : "Failed to mint PKP",
      };
    }
  }, [client, user?.type, setPKP, pkp]);

  return {
    pkp,
    mintPKP,
    isReady: !!client,
  };
}
