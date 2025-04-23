import { useCallback } from "react";
import { useLitContext } from "./useLitContext";
import { PKPMintInfo } from "./usePKPMint";
import { AuthMethod, SessionSigs } from "@lit-protocol/types";
import { AUTH_METHOD_TYPE, LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";

const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useSessionSigs() {
  const { litNodeClient, pkp, sessionSigs, setSessionSigs } = useLitContext();

  const getSessionSigs = useCallback(async (): Promise<SessionSigs | null> => {
    try {
      if (!litNodeClient || !pkp) {
        throw new Error("Lit Node Client or PKP not initialized");
      }

      // Create auth method using PKP
      const authMethod: AuthMethod = {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: JSON.stringify({
          pkp: pkp,
        }),
      };

      // Get session signatures with proper resource abilities
      const newSessionSigs = await litNodeClient.getPkpSessionSigs({
        pkpPublicKey: pkp.publicKey,
        authMethods: [authMethod],
        resourceAbilityRequests: [
          {
            resource: new LitPKPResource(pkp.tokenId), // Use specific PKP tokenId instead of wildcard
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
        expiration: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
      });

      if (!newSessionSigs) {
        throw new Error("Failed to get session signatures");
      }

      // Update context with new session signatures
      setSessionSigs(newSessionSigs);

      return newSessionSigs;
    } catch (error) {
      console.error("Failed to get session signatures:", error);
      return null;
    }
  }, [litNodeClient, pkp, setSessionSigs]);

  return {
    sessionSigs,
    getSessionSigs,
  };
}
