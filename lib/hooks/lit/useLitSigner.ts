import { Chain } from "viem";
import { useCallback, useState } from "react";
import { getLitClient } from "../../sdk/lit/lit-client";
import { useSessionSigs } from "../../sdk/lit/sessionSigs";
import { useUser } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import type { AuthSig, SessionSigs } from "@lit-protocol/types";

interface UseLitSignerProps {
  pkpPublicKey: string;
  chain: Chain;
}

interface LitSignerState {
  signer: LitNodeClient | null;
  isAuthenticated: boolean;
  error: Error | null;
  sessionSigs?: SessionSigs;
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

  const validateSession = useCallback(async (sessionSigs: SessionSigs) => {
    if (!sessionSigs) return false;
    const expiration =
      typeof sessionSigs.expiration === "string"
        ? new Date(sessionSigs.expiration).getTime()
        : 0;
    return Date.now() < expiration;
  }, []);

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
      const litNodeClient = new LitNodeClient({
        litNetwork: LIT_NETWORK.Datil,
        debug: false,
      });

      await litNodeClient.connect();

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

      // Check existing session sigs
      if (state.sessionSigs && (await validateSession(state.sessionSigs))) {
        console.log("Using existing valid session signatures");
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          error: null,
        }));
        return signer;
      }

      // Get fresh session signatures
      const sessionSigs = await getSessionSigs();
      if (!sessionSigs) throw new Error("Failed to get session signatures");

      // Validate new session signatures
      const isValid = await validateSession(sessionSigs);
      if (!isValid) throw new Error("Invalid session signatures received");

      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        sessionSigs,
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
  }, [
    state.signer,
    state.sessionSigs,
    initializeSigner,
    getSessionSigs,
    user?.type,
    validateSession,
  ]);

  return {
    signer: state.signer,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    sessionSigs: state.sessionSigs,
    initializeSigner,
    authenticate,
  };
}
