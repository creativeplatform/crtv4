import { useCallback } from "react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { getContractClient } from "../../sdk/lit/lit-contracts";
import { useUser } from "@account-kit/react";
import { useLitContext } from "./useLitContext";
import type { ContractReceipt } from "@ethersproject/contracts";

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

      // Mint PKP using ECDSA (keyType = 2)
      const tx = await contractClient.pkpNftContract.write.mintNext([2]);
      const receipt = (await tx.wait()) as ContractReceipt;

      // Get PKP details from receipt
      const mintEvent = receipt.events?.find(
        (event) => event.event === "PKPMinted"
      );

      if (!mintEvent || !mintEvent.args) {
        throw new Error("Failed to find PKP mint event");
      }

      const pkpInfo = {
        tokenId: mintEvent.args.tokenId.toString(),
        publicKey: mintEvent.args.pubKey,
        ethAddress: mintEvent.args.ethAddress,
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
  }, [client, user?.type, setPKP]);

  return {
    pkp,
    mintPKP,
    isReady: !!client,
  };
}
