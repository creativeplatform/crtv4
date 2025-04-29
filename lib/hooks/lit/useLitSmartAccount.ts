/**
 * @file useLitSmartAccount.ts
 * @description React hook that integrates Lit Protocol PKP with Smart Account functionality.
 *
 * This hook manages the complete lifecycle of a Lit Protocol Smart Account including:
 * - Initializing and connecting to the Lit Network
 * - Minting Programmable Key Pairs (PKPs) when needed
 * - Authenticating through session signatures
 * - Maintaining PKP state and authentication status
 * - Providing access to the underlying Smart Account client
 *
 * @requires LitNodeClient from @lit-protocol/lit-node-client
 * @requires useSmartAccountClient from @account-kit/react
 * @requires useLitSigner for Lit Protocol signing capabilities
 * @requires useSessionSigs for session signature management
 * @requires usePKPMint for minting new PKPs when needed
 *
 * @param pkpPublicKey - The public key of the PKP (Programmable Key Pair)
 * @param chain - The blockchain network configuration (defaults to baseSepolia)
 *
 * @returns {Object} An object containing:
 *   - client: The Smart Account client instance
 *   - address: The Smart Account wallet address
 *   - error: Any error that occurred during initialization or authentication
 *   - isLoadingClient: Boolean indicating if the client is loading
 *   - isAuthenticated: Boolean indicating authentication status
 *   - isAuthenticating: Boolean indicating if authentication is in progress
 *   - isInitialized: Boolean indicating if the hook has been initialized
 *   - pkpInfo: Information about the PKP including tokenId, publicKey, and ethAddress
 *   - authenticate: Function to authenticate with Lit Protocol
 *   - initialize: Function to initialize the Lit Smart Account
 *
 * @example
 * const {
 *   client,
 *   address,
 *   isAuthenticated,
 *   authenticate,
 *   pkpInfo
 * } = useLitSmartAccount({
 *   pkpPublicKey: "0x...",
 *   chain: chains.polygon
 * });
 *
 * @dev Notes:
 * - This hook requires a PKP public key to function properly
 * - The hook will attempt to mint a new PKP if one is not provided or found
 * - Initialize must be called before authenticate
 * - Session signatures are automatically managed and validated
 * - Uses the Lit Datil network by default
 */

import { Chain } from "viem";
import { useCallback, useState } from "react";
import { useLitSigner } from "./useLitSigner";
import { useSmartAccountClient } from "@account-kit/react";
import { baseSepolia } from "@account-kit/infra";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { useSessionSigs } from "../../sdk/lit/sessionSigs";
import { usePKPMint } from "./usePKPMint";

interface UseLitSmartAccountProps {
  pkpPublicKey: string;
  chain?: Chain;
}

interface SmartAccountState {
  error: Error | null;
  isAuthenticating: boolean;
  isInitialized: boolean;
  pkpInfo?: {
    tokenId: string;
    publicKey: string;
    ethAddress: string;
  };
}

export function useLitSmartAccount({
  pkpPublicKey,
  chain = baseSepolia,
}: UseLitSmartAccountProps) {
  const [state, setState] = useState<SmartAccountState>({
    error: null,
    isAuthenticating: false,
    isInitialized: false,
  });

  const {
    signer,
    isAuthenticated,
    error: signerError,
    sessionSigs,
  } = useLitSigner({
    pkpPublicKey,
    chain,
  });

  const { client, address, isLoadingClient } = useSmartAccountClient({
    type: "ModularAccountV2",
    accountParams: {
      mode: "default",
    },
  });

  const { getSessionSigs } = useSessionSigs();
  const { mintPKP } = usePKPMint();

  const initialize = useCallback(async () => {
    if (state.isInitialized) return true;

    setState((prev) => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      if (!client) throw new Error("Smart account client not initialized");
      if (!pkpPublicKey) throw new Error("PKP public key is required");

      // Initialize LitNodeClient
      const litNodeClient = new LitNodeClient({
        litNetwork: LIT_NETWORK.Datil,
        debug: false,
      });

      console.log("Connecting to Lit Network...");
      await litNodeClient.connect();

      // Mint PKP if needed
      if (!state.pkpInfo) {
        console.log("Minting new PKP...");
        const mintResult = await mintPKP();
        if (!mintResult.success || !mintResult.pkp) {
          throw new Error(mintResult.error || "Failed to mint PKP");
        }

        // Convert PKPMintInfo to SmartAccountState.pkpInfo format
        const pkpInfo = {
          tokenId: mintResult.pkp.tokenId,
          publicKey: mintResult.pkp.publicKey,
          ethAddress: mintResult.pkp.ethAddress,
        };

        setState((prev) => ({ ...prev, pkpInfo }));
      }

      // Get session signatures
      console.log("Getting session signatures...");
      const sessionSigs = await getSessionSigs(pkpPublicKey);
      if (!sessionSigs) throw new Error("Failed to get session signatures");

      setState((prev) => ({ ...prev, isInitialized: true }));
      console.log("Initialization successful");
      return true;
    } catch (error) {
      console.error("Initialization failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Initialization failed";
      setState((prev) => ({ ...prev, error: new Error(errorMessage) }));
      return false;
    } finally {
      setState((prev) => ({ ...prev, isAuthenticating: false }));
    }
  }, [
    client,
    pkpPublicKey,
    getSessionSigs,
    mintPKP,
    state.pkpInfo,
    state.isInitialized,
  ]);

  const authenticate = useCallback(async () => {
    if (state.isAuthenticating) return false;

    setState((prev) => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      // Ensure initialization
      const isInitialized = await initialize();
      if (!isInitialized) throw new Error("Failed to initialize");

      // Verify client and PKP
      if (!client) throw new Error("Smart account client not initialized");
      if (!state.pkpInfo) throw new Error("PKP not minted");

      // Verify session signatures
      if (!sessionSigs) throw new Error("No valid session signatures");

      console.log("Authentication successful");
      return true;
    } catch (error) {
      console.error("Authentication failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      setState((prev) => ({ ...prev, error: new Error(errorMessage) }));
      return false;
    } finally {
      setState((prev) => ({ ...prev, isAuthenticating: false }));
    }
  }, [client, initialize, sessionSigs, state.isAuthenticating, state.pkpInfo]);

  return {
    client,
    address,
    error: state.error || signerError,
    isLoadingClient,
    isAuthenticated,
    isAuthenticating: state.isAuthenticating,
    isInitialized: state.isInitialized,
    pkpInfo: state.pkpInfo,
    authenticate,
    initialize,
  };
}
