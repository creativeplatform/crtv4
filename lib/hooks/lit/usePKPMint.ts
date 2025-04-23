import { useCallback } from "react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { getContractClient } from "../../sdk/lit/lit-contracts";
import { useUser } from "@account-kit/react";
import { useLitContext } from "./useLitContext";
import type { ContractReceipt } from "@ethersproject/contracts";
import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE } from "@lit-protocol/constants";
import { toHex } from "viem";

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

      // Create auth method using the user's smart account
      const authMethod = {
        authMethodType: toHex(2), // EthWallet type
        id: user.address,
        userPubkey: "0x" as const, // No pubkey needed for ETH wallet auth
      };

      // Define scopes for the PKP
      const scopes = [
        AUTH_METHOD_SCOPE.SignAnything,
        AUTH_METHOD_SCOPE.PersonalSign,
      ];

      // Mint PKP with auth method and scopes
      const mintTx = await contractClient.pkpNftContract.write.mintNext([2]); // 2 = ECDSA
      const receipt = (await mintTx.wait()) as ContractReceipt;

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

      // Add auth method to PKP
      const addAuthTx =
        await contractClient.pkpPermissionsContract.write.addPermittedAuthMethod(
          pkpInfo.tokenId,
          authMethod,
          scopes
        );
      await addAuthTx.wait();

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
  }, [client, user?.type, user?.address, setPKP]);

  return {
    pkp,
    mintPKP,
    isReady: !!client,
  };
}
