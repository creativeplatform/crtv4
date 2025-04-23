import { Chain } from "viem";
import { useCallback, useState } from "react";
import { useLitSigner } from "./useLitSigner";
import { useSmartAccountClient } from "@account-kit/react";
import { baseSepolia } from "@account-kit/infra";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { useSessionSigs } from "../../sdk/lit/sessionSigs";
import { usePKPMint, PKPMintInfo } from "./usePKPMint";

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
      const sessionSigs = await getSessionSigs();
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
