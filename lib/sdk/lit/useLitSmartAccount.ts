import { Chain } from "viem";
import { useCallback, useState } from "react";
import { useLitSigner } from "./useLitSigner";
import { useSmartAccountClient } from "@account-kit/react";
import { baseSepolia } from "@account-kit/infra";

interface UseLitSmartAccountProps {
  pkpPublicKey: string;
  chain?: Chain;
}

interface SmartAccountState {
  error: Error | null;
}

export function useLitSmartAccount({
  pkpPublicKey,
  chain = baseSepolia,
}: UseLitSmartAccountProps) {
  const [state, setState] = useState<SmartAccountState>({
    error: null,
  });

  const { signer, authenticate, isAuthenticated } = useLitSigner({
    pkpPublicKey,
    chain,
  });

  // Use Account Kit's smart account client
  const { client, address, isLoadingClient } = useSmartAccountClient({
    type: "ModularAccountV2",
    accountParams: {
      mode: "default",
    },
  });

  const initializeAccount = useCallback(async () => {
    try {
      if (!signer) throw new Error("PKP signer not initialized");
      if (!isAuthenticated) await authenticate();

      // The smart account client is automatically initialized by Account Kit
      // We just need to ensure the signer is authenticated

      return { client, address };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize smart account";
      setState({
        error: new Error(errorMessage),
      });
      throw error;
    }
  }, [signer, isAuthenticated, authenticate, client, address]);

  return {
    client,
    address,
    error: state.error,
    isLoadingClient,
    isAuthenticated,
    initializeAccount,
  };
}
