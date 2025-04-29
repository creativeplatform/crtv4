/**
 * @file useEoaSigner.ts
 * @description A React hook that creates and manages an EOA (Externally Owned Account) signer
 * for Lit Protocol authentication.
 *
 * This hook abstracts the complexities of creating a wallet client using a private key.
 * It uses viem's createWalletClient and privateKeyToAccount utilities to create a signer
 * that can be used for authentication with Lit Protocol.
 *
 * @dev SECURITY NOTE: In production, ensure private keys are securely managed and not
 * exposed in client-side code. Consider using a secure key management service or
 * server-side signing when possible.
 *
 * @dev This hook targets the Base Sepolia testnet. Update the chain configuration
 * for different networks.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { signer, address, error, initializeSigner } = useEoaSigner();
 *
 *   useEffect(() => {
 *     // Initialize the signer when the component mounts
 *     initializeSigner();
 *   }, [initializeSigner]);
 *
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!signer) return <div>Loading signer...</div>;
 *
 *   return <div>Connected with address: {address}</div>;
 * }
 * ```
 */

import { useCallback, useState } from "react";
import { createWalletClient, http, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "@account-kit/infra";

/**
 * State interface for the EOA signer hook
 * @property {WalletClient | null} signer - The viem wallet client instance
 * @property {string | null} address - The wallet address associated with the signer
 * @property {Error | null} error - Any error that occurred during initialization
 */
interface EOASignerState {
  signer: WalletClient | null;
  address: string | null;
  error: Error | null;
}

/**
 * Hook for creating and managing an EOA signer for Lit Protocol authentication
 * @returns {Object} An object containing the signer state and initialization function
 */
export function useEoaSigner() {
  const [state, setState] = useState<EOASignerState>({
    signer: null,
    address: null,
    error: null,
  });

  /**
   * Initializes the EOA signer using the private key from environment variables
   * @returns {Promise<WalletClient | null>} The wallet client or null if initialization fails
   */
  const initializeSigner = useCallback(async () => {
    try {
      // In production, you would get this from a secure source
      // For development, you can use an environment variable
      const privateKey = process.env.NEXT_PUBLIC_LIT_AUTH_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("Private key not found for Lit authentication");
      }

      // Create account from private key
      const account = privateKeyToAccount(privateKey as `0x${string}`);

      // Create wallet client
      const client = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(
          `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        ),
      });

      setState({
        signer: client,
        address: account.address,
        error: null,
      });

      return client;
    } catch (error) {
      console.error("Failed to initialize EOA signer:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to initialize EOA signer"),
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    initializeSigner,
  };
}
