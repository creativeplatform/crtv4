/**
 * useUnifiedSessionSigner Hook
 * 
 * This hook provides a unified interface for integrating with both smart contract accounts 
 * and traditional EOA wallets for Lit Protocol authentication and signing.
 * 
 * Purpose:
 * - Creates a consistent signing interface regardless of the wallet type (SCA or EOA)
 * - Automatically selects the appropriate signer based on the connected wallet type
 * - Handles Lit Protocol session authentication for both wallet types
 * - Simplifies integration with PKP (Programmable Key Pair) functionality
 * 
 * How it works:
 * 1. Detects the current wallet type using Account Kit's useUser hook
 * 2. For smart contract accounts (SCA), uses Lit Protocol signing with PKP
 * 3. For externally owned accounts (EOA), falls back to standard EOA signing
 * 
 * Dependencies:
 * - @account-kit/react: For detecting account type (SCA vs EOA)
 * - useLitSigner: Custom hook for Lit Protocol signing with PKP
 * - useEoaSigner: Custom hook for standard EOA signing
 * 
 * Props:
 * - pkpPublicKey: The public key of the PKP to use for signing
 * - chain: The blockchain network configuration object
 * 
 * Returns:
 * - signer: The appropriate signer instance based on wallet type
 * - isAuthenticated: Boolean indicating if the user is authenticated
 * - error: Any errors that occurred during initialization
 * - sessionSigs: Lit Protocol session signatures (only for SCA)
 * - initializeSigner: Function to initialize the signer
 * - authenticate: Function to authenticate with Lit Protocol
 * 
 * Usage Example:
 * ```tsx
 * const { signer, isAuthenticated, authenticate } = useUnifiedSessionSigner({
 *   pkpPublicKey: "0x...",
 *   chain: mainnet
 * });
 * 
 * // Initialize authentication
 * useEffect(() => {
 *   if (!isAuthenticated) {
 *     authenticate();
 *   }
 * }, [isAuthenticated, authenticate]);
 * ```
 * 
 * Note: This hook abstracts away the differences between SCA and EOA wallets,
 * providing a consistent interface for Lit Protocol operations.
 */

import { useUser } from "@account-kit/react";
import { useLitSigner } from "@/lib/hooks/lit/useLitSigner";
import { useEoaSigner } from "@/lib/hooks/lit/useEoaSigner";
import type { Chain } from "viem";
import type { SessionSigs } from "@lit-protocol/types";

export function useUnifiedSessionSigner({
  pkpPublicKey,
  chain,
}: UseUnifiedSessionSignerProps): UseUnifiedSessionSignerResult {
  const user = useUser();
  const lit = useLitSigner({ pkpPublicKey, chain });
  const eoa = useEoaSigner();

  if (user?.type === "sca") {
    return {
      signer: lit.signer,
      isAuthenticated: lit.isAuthenticated,
      error: lit.error,
      sessionSigs: lit.sessionSigs,
      initializeSigner: lit.initializeSigner,
      authenticate: lit.authenticate,
    };
  }

  // fallback to EOA
  return {
    signer: eoa.signer,
    isAuthenticated: !!eoa.address,
    error: eoa.error,
    sessionSigs: undefined, // EOA may not use session sigs
    initializeSigner: eoa.initializeSigner,
    authenticate: async () => !!eoa.address,
  };
}

// --- Types ---

interface UseUnifiedSessionSignerProps {
  pkpPublicKey: string;
  chain: Chain;
}

interface UseUnifiedSessionSignerResult {
  signer: any;
  isAuthenticated: boolean;
  error: Error | null;
  sessionSigs?: SessionSigs;
  initializeSigner: () => Promise<any>;
  authenticate: () => Promise<any>;
}
