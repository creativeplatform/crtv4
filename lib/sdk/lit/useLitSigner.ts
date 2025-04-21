import { Chain } from "viem";
import { useCallback, useState } from "react";
import { config } from "@/config";
import { getLitClient } from "./lit-client";
import { useSessionSigs } from "./sessionSigs";
import { useSmartAccountClient, useSigner } from "@account-kit/react";
import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";

interface UseLitSignerProps {
  pkpPublicKey: string;
  chain: Chain;
}

interface LitSignerState {
  signer: PKPEthersWallet | null;
  isAuthenticated: boolean;
  error: Error | null;
}

export function useLitSigner({ pkpPublicKey, chain }: UseLitSignerProps) {
  const [state, setState] = useState<LitSignerState>({
    signer: null,
    isAuthenticated: false,
    error: null,
  });
  const { getSessionSigs } = useSessionSigs();
  const accountSigner = useSigner();

  const initializeSigner = useCallback(async () => {
    try {
      if (!pkpPublicKey) throw new Error("PKP public key is required");

      // Create PKP Ethers wallet instance
      const pkpWallet = new PKPEthersWallet({
        pkpPubKey: pkpPublicKey,
        litNodeClient: await getLitClient(),
        rpc: chain.rpcUrls.default.http[0],
      });

      // Initialize the wallet
      await pkpWallet.init();

      setState((prev) => ({ ...prev, signer: pkpWallet, error: null }));
      return pkpWallet;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize PKP signer";
      setState((prev) => ({
        ...prev,
        error: new Error(errorMessage),
      }));
      throw error;
    }
  }, [pkpPublicKey, chain]);

  const authenticate = useCallback(async () => {
    try {
      const signer = state.signer || (await initializeSigner());
      if (!signer) throw new Error("Signer not initialized");

      // Get session signatures for authentication
      const sessionSigs = await getSessionSigs();

      // Re-initialize the wallet
      await signer.init();

      setState((prev) => ({ ...prev, isAuthenticated: true, error: null }));
      return signer;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to authenticate PKP signer";
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        error: new Error(errorMessage),
      }));
      throw error;
    }
  }, [state.signer, initializeSigner, getSessionSigs]);

  return {
    signer: state.signer,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    initializeSigner,
    authenticate,
  };
}
