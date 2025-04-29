import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { PKPMintInfo } from "../lib/hooks/lit/usePKPMint";
import type { SessionSigs } from "@lit-protocol/types";

/**
 * PKP (Programmable Key Pair) information structure
 * 
 * @property {string} tokenId - The unique identifier of the PKP NFT
 * @property {string} publicKey - The public key associated with the PKP
 * @property {string} ethAddress - The Ethereum address derived from the PKP
 */
export interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

/**
 * Lit Protocol Context Type Definition
 * 
 * This defines all state and functions available through the Lit Context:
 * - litNodeClient: The connection to the Lit Protocol network
 * - PKP: Programmable Key Pair information for the user
 * - sessionSigs: Authentication signatures for the Lit Protocol network
 * 
 * @interface LitContextType
 */
interface LitContextType {
  /** Active Lit Protocol network client instance */
  litNodeClient: LitNodeClient | null;
  /** Update the Lit Protocol client instance */
  setLitNodeClient: (client: LitNodeClient | null) => void;
  /** Current user's PKP information */
  pkp: PKPMintInfo | null;
  /** Update the current PKP information */
  setPKP: (pkp: PKPMintInfo | null) => void;
  /** Session signatures for authenticating with Lit Protocol */
  sessionSigs: SessionSigs | null;
  /** Update session signatures */
  setSessionSigs: (sigs: SessionSigs | null) => void;
}

/**
 * Create the Lit Protocol Context with default values
 */
const LitContext = createContext<LitContextType>({
  litNodeClient: null,
  setLitNodeClient: () => {},
  pkp: null,
  setPKP: () => {},
  sessionSigs: null,
  setSessionSigs: () => {},
});

/**
 * Lit Protocol Provider Component
 * 
 * This provider establishes a connection to the Lit Protocol network
 * and manages authentication state throughout the application.
 * 
 * Usage:
 * ```tsx
 * <LitProvider>
 *   <YourApp />
 * </LitProvider>
 * ```
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export function LitProvider({ children }: { children: ReactNode }) {
  // Lit Node Client for connecting to the Lit Protocol network
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(
    null
  );
  
  // PKP information for the current user
  const [pkp, setPKP] = useState<PKPMintInfo | null>(null);
  
  // Session signatures for authentication with Lit Protocol
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);

  /**
   * Initialize a connection to the Lit Protocol network
   * 
   * @returns {Promise<LitNodeClient|null>} Connected client or null on failure
   */
  const initLitClient = useCallback(async () => {
    try {
      const client = new LitNodeClient({
        litNetwork: LIT_NETWORK.Datil,
        debug: false,
      });
      await client.connect();
      setLitNodeClient(client);
      return client;
    } catch (error) {
      console.error("Failed to initialize Lit client:", error);
      return null;
    }
  }, []);

  return (
    <LitContext.Provider
      value={{
        litNodeClient,
        setLitNodeClient,
        pkp,
        setPKP,
        sessionSigs,
        setSessionSigs,
      }}
    >
      {children}
    </LitContext.Provider>
  );
}

/**
 * Custom hook to access the Lit Protocol context
 * 
 * Use this hook in any component that needs to interact with
 * Lit Protocol functionality, access PKP information, or
 * manage session signatures.
 * 
 * Example usage:
 * ```tsx
 * function MyComponent() {
 *   const { litNodeClient, pkp, sessionSigs } = useLitContext();
 *   
 *   // Use Lit Protocol functionality here
 *   
 *   return <div>...</div>;
 * }
 * ```
 * 
 * @returns {LitContextType} The Lit Protocol context values and functions
 * @throws {Error} If used outside of a LitProvider
 */
export function useLitContext() {
  const context = useContext(LitContext);
  if (!context) {
    throw new Error("useLitContext must be used within a LitProvider");
  }
  return context;
}
