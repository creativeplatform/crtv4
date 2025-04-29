/**
 * @file useLitSigner.ts
 * @description A React hook that provides Lit Protocol signer functionality.
 *
 * This hook manages the lifecycle of a Lit Protocol signer including:
 * - Initializing a LitNodeClient instance
 * - Authenticating with Lit Protocol using session signatures
 * - Validating existing sessions
 * - Managing authentication state
 *
 * @requires LitNodeClient from @lit-protocol/lit-node-client
 * @requires useSessionSigs from our SDK
 * @requires useModularAccount for Smart Contract Account integration
 *
 * @param pkpPublicKey - The public key of the PKP (Programmable Key Pair)
 * @param chain - The blockchain network configuration
 *
 * @returns {Object} An object containing:
 *   - signer: The LitNodeClient instance
 *   - isAuthenticated: Boolean indicating if the user is authenticated
 *   - error: Any error that occurred during initialization or authentication
 *   - sessionSigs: The current session signatures
 *   - initializeSigner: Function to initialize the Lit signer
 *   - authenticate: Function to authenticate with Lit Protocol
 *
 * @example
 * const { signer, isAuthenticated, error, authenticate } = useLitSigner({
 *   pkpPublicKey: "0x...",
 *   chain: chains.polygon
 * });
 *
 * @dev Note: This hook requires a Smart Contract Account (SCA) user type.
 * It will not work with EOA accounts.
 */

import { Chain } from "viem";
import { useCallback, useState } from "react";
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

  // Add to lib/hooks/lit/useLitSigner.ts
  const authenticate = useCallback(async () => {
    try {
      if (!user?.type || user.type !== "sca")
        throw new Error("Smart Contract Account required");

      const signer = state.signer || (await initializeSigner());
      if (!signer) throw new Error("Signer not initialized");

      // Validate session
      if (state.sessionSigs && (await validateSession(state.sessionSigs))) {
        return signer;
      }

      // Get fresh session sigs
      const sessionSigs = await getSessionSigs(pkpPublicKey);
      if (!sessionSigs) throw new Error("Failed to get session signatures");

      return signer;
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  }, [
    state.signer,
    state.sessionSigs,
    initializeSigner,
    getSessionSigs,
    user?.type,
    validateSession,
    pkpPublicKey,
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
