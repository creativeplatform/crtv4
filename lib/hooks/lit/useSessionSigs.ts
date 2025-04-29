import { useCallback } from "react";
import { useLitContext } from "../../../context/LitContext";
import { AuthMethod, SessionSigs } from "@lit-protocol/types";
import { AUTH_METHOD_TYPE, LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import { useEoaSigner } from "./useEoaSigner";

/**
 * Duration for which session signatures remain valid
 * @constant
 * @type {number}
 */
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Hook for managing Lit Protocol session signatures
 * 
 * This hook provides functionality to:
 * 1. Generate session signatures for PKP authentication
 * 2. Handle authentication with the Lit Protocol network
 * 3. Manage session signature state
 * 
 * Session signatures allow applications to interact with Lit Protocol without 
 * requiring users to sign every transaction, improving UX significantly.
 * 
 * @returns {Object} Session signature management functions and state
 * @returns {SessionSigs|null} sessionSigs - Current session signatures or null if not authenticated
 * @returns {Function} getSessionSigs - Function to generate new session signatures
 */
export function useSessionSigs() {
  const { litNodeClient, pkp, sessionSigs, setSessionSigs } = useLitContext();
  const { signer: eoaSigner, address: eoaAddress } = useEoaSigner();

  /**
   * Generates new session signatures for the current PKP
   * 
   * Flow:
   * 1. Validates prerequisites (litNodeClient, PKP, EOA signer)
   * 2. Creates an auth method using the PKP
   * 3. Requests session signatures from the Lit Node with appropriate permissions
   * 4. Updates context with the new session signatures
   * 
   * Note: Session signatures expire after SESSION_EXPIRY (24 hours by default)
   * 
   * @returns {Promise<SessionSigs|null>} The generated session signatures or null on failure
   */
  const getSessionSigs = useCallback(async (
    publicKey?: string
  ): Promise<SessionSigs | null> => {
    try {
      // Use provided public key or default to pkp.publicKey
      const pkpPublicKey = publicKey || pkp?.publicKey;
      
      if (!litNodeClient || !pkp) {
        throw new Error("Lit Node Client or PKP not initialized");
      }
      if (!eoaSigner || !eoaAddress) {
        console.error("EOA signer required for Lit authentication");
        return null;
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
  }, [litNodeClient, pkp, setSessionSigs, eoaSigner, eoaAddress]);

  return {
    sessionSigs,
    getSessionSigs,
  };
}
