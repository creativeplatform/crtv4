import { Chain } from "viem";
import { useCallback, useState } from "react";
import { useLitSigner } from "./useLitSigner";
import { useSmartAccountClient } from "@account-kit/react";
import { baseSepolia } from "@account-kit/infra";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { useSessionSigs } from "../../sdk/lit/sessionSigs";

interface UseLitSmartAccountProps {
  pkpPublicKey: string;
  chain?: Chain;
}

interface SmartAccountState {
  error: Error | null;
  isAuthenticating: boolean;
}

export function useLitSmartAccount({
  pkpPublicKey,
  chain = baseSepolia,
}: UseLitSmartAccountProps) {
  const [state, setState] = useState<SmartAccountState>({
    error: null,
    isAuthenticating: false,
  });

  const {
    signer,
    isAuthenticated,
    error: signerError,
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

  const authenticate = useCallback(async () => {
    if (state.isAuthenticating) return false;

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

      console.log("Getting session signatures...");
      const sessionSigs = await getSessionSigs();
      if (!sessionSigs) throw new Error("Failed to get session signatures");

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
  }, [client, pkpPublicKey, getSessionSigs]);

  return {
    client,
    address,
    error: state.error || signerError,
    isLoadingClient,
    isAuthenticated,
    isAuthenticating: state.isAuthenticating,
    authenticate,
  };
}
