import { useCallback } from "react";
import { useLitContext } from "./useLitContext";
import { getSessionsResponseToJSON } from "livepeer/models/operations";
import { PKPMintInfo } from "./usePKPMint";
import { AuthMethod, SessionSigs } from "@lit-protocol/types";
import { AUTH_METHOD_TYPE } from "@lit-protocol/constants";

export function useSessionSigs() {
  const { litNodeClient, pkp, sessionSigs, setSessionSigs } = useLitContext();

  const getSessionSigs = useCallback(async (): Promise<SessionSigs | null> => {
    try {
      if (!litNodeClient || !pkp) {
        throw new Error("Lit Node Client or PKP not initialized");
      }

      // Check if we already have valid session signatures
      if (sessionSigs) return sessionSigs;

      // Create auth method using PKP
      const authMethod: AuthMethod = {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: JSON.stringify({
          pkp: pkp,
        }),
      };

      // Get session signatures
      const newSessionSigs = await getSessionSigs();

      if (!newSessionSigs) {
        throw new Error("Failed to get session signatures");
      }

      // Update context
      setSessionSigs(newSessionSigs);

      return newSessionSigs;
    } catch (error) {
      console.error("Failed to get session signatures:", error);
      return null;
    }
  }, [litNodeClient, pkp, sessionSigs, setSessionSigs]);

  return {
    sessionSigs,
    getSessionSigs,
  };
}
