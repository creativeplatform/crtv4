import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import type { AuthSig } from "@lit-protocol/types";
import { PKPMintInfo } from "./usePKPMint";
import type { SessionSigs } from "@lit-protocol/types";

export interface PKPInfo {
  tokenId: string;
  publicKey: string;
  ethAddress: string;
}

interface LitContextType {
  litNodeClient: LitNodeClient | null;
  setLitNodeClient: (client: LitNodeClient | null) => void;
  pkp: PKPMintInfo | null;
  setPKP: (pkp: PKPMintInfo | null) => void;
  sessionSigs: SessionSigs | null;
  setSessionSigs: (sigs: SessionSigs | null) => void;
}

const LitContext = createContext<LitContextType>({
  litNodeClient: null,
  setLitNodeClient: () => {},
  pkp: null,
  setPKP: () => {},
  sessionSigs: null,
  setSessionSigs: () => {},
});

export function LitProvider({ children }: { children: ReactNode }) {
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(
    null
  );
  const [pkp, setPKP] = useState<PKPMintInfo | null>(null);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);

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

export function useLitContext() {
  const context = useContext(LitContext);
  if (!context) {
    throw new Error("useLitContext must be used within a LitProvider");
  }
  return context;
}
