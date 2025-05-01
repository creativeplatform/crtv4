import { useUser } from "@account-kit/react";
import useModularAccount from "./useModularAccount";
import { isWalletConnected } from "@/lib/utils/wallet";

/**
 * Custom hook that combines wallet connection status checks
 * @returns Object containing wallet status information
 */
export function useWalletStatus() {
  const user = useUser();
  const {
    smartAccountClient,
    loading: isLoadingClient,
    signerReady,
  } = useModularAccount();

  // Use our utility function to check wallet connection
  const isConnected = isWalletConnected(user, smartAccountClient);

  return {
    isConnected,
    isLoadingClient,
    signerReady,
    hasSmartAccount: !!smartAccountClient,
    walletAddress: user?.address || null,
    smartAccountAddress: smartAccountClient?.account?.address || null,
    user,
    smartAccountClient,
  };
}
