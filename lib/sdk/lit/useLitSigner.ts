import { Chain } from "viem";
import { useCallback, useState } from "react";
import { getLitClient } from "./lit-client";
import { useSessionSigs } from "./sessionSigs";
import { useUser } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/useModularAccount";

interface UseLitSignerProps {
  pkpPublicKey: string;
  chain: Chain;
}

interface LitSignerState {
  signer: any; // Will be replaced with proper type once package is installed
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
  const { smartAccountClient: client } = useModularAccount();
  const user = useUser();

  const initializeSigner = useCallback(async () => {
    try {
      if (!pkpPublicKey) throw new Error("PKP public key is required");
      if (!user?.type || user.type !== "sca")
        throw new Error("Smart Contract Account required for Lit Protocol");
      if (!client) throw new Error("Smart Account client not initialized");

      console.log("Initializing Lit Signer with:", {
        pkpPublicKey,
        chainId: chain.id,
        userType: user.type,
      });

      // Create LitSigner instance
      const litNodeClient = await getLitClient();
      if (!litNodeClient) throw new Error("Lit client not initialized");

      // For now, return the Lit Node Client as the signer
      // This will be replaced with LitSigner once the package is installed
      setState((prev) => ({
        ...prev,
        signer: litNodeClient,
        error: null,
      }));
      return litNodeClient;
    } catch (error) {
      console.error("Failed to initialize Lit signer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize Lit signer";
      setState((prev) => ({
        ...prev,
        error: new Error(errorMessage),
      }));
      throw error;
    }
  }, [pkpPublicKey, chain, client, user?.type]);

  const authenticate = useCallback(async () => {
    try {
      if (!user?.type || user.type !== "sca") {
        throw new Error("Smart Contract Account required for Lit Protocol");
      }

      const signer = state.signer || (await initializeSigner());
      if (!signer) throw new Error("Signer not initialized");

      console.log("Authenticating Lit signer...");

      // Get session signatures for authentication
      const sessionSigs = await getSessionSigs();
      if (!sessionSigs) throw new Error("Failed to get session signatures");

      // Store session signatures in the signer's state
      // This will be replaced with proper authentication once package is installed
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        error: null,
      }));

      console.log("Lit signer authenticated successfully");
      return signer;
    } catch (error) {
      console.error("Failed to authenticate Lit signer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to authenticate Lit signer";
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        error: new Error(errorMessage),
      }));
      throw error;
    }
  }, [state.signer, initializeSigner, getSessionSigs, user?.type]);

  return {
    signer: state.signer,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    initializeSigner,
    authenticate,
  };
}
