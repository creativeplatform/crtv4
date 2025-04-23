import { useCallback, useState } from "react";
import { createWalletClient, http, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "@account-kit/infra";

interface EOASignerState {
  signer: WalletClient | null;
  address: string | null;
  error: Error | null;
}

export function useEoaSigner() {
  const [state, setState] = useState<EOASignerState>({
    signer: null,
    address: null,
    error: null,
  });

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
