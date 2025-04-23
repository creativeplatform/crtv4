import { useCallback, useState } from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORKS, LIT_ERROR, LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import type {
  AuthSig,
  AuthCallback,
  AuthCallbackParams,
  SignerLike,
  LitResourceAbilityRequest,
  SessionSigs,
} from "@lit-protocol/types";
import { useUser } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { isEOA } from "@/lib/utils/wallet";
import { validateAuthSig, validateAuthParams } from "./types/auth";
import { useEoaSigner } from "@/lib/hooks/lit/useEoaSigner";

const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface SessionError extends Error {
  code: string;
  details?: unknown;
}

interface ValidateAuthParams {
  chain: string;
  expiration: string;
  pkpPublicKey: string;
  resourceAbilityRequests: LitResourceAbilityRequest[];
  nonce: string;
}

function createSessionError(
  message: string,
  code: string,
  details?: unknown
): SessionError {
  const error = new Error(message) as SessionError;
  error.code = code;
  if (details) error.details = details;
  return error;
}

export function useSessionSigs() {
  const { smartAccountClient: client } = useModularAccount();
  const { signer: eoaSigner, address: eoaAddress } = useEoaSigner();
  const user = useUser();
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);

  const initLitClient = useCallback(async (): Promise<LitNodeClient | null> => {
    try {
      const client = new LitNodeClient({
        litNetwork: "datil-dev",
        debug: false,
      });
      await client.connect();
      setLitNodeClient(client);
      setIsConnected(true);
      return client;
    } catch (error) {
      console.error("Failed to initialize Lit client:", error);
      return null;
    }
  }, []);

  // Add to lib/sdk/lit/sessionSigs.ts
  const validateSession = useCallback(
    async (sigs: SessionSigs): Promise<boolean> => {
      if (!sigs || typeof sigs.expiration !== "string") return false;

      // Check expiration
      const expiration = new Date(sigs.expiration).getTime();
      if (Date.now() >= expiration) return false;

      // Validate auth parameters
      const params: ValidateAuthParams = {
        chain: "base-sepolia",
        expiration: sigs.expiration,
        pkpPublicKey:
          typeof sigs.pkpPublicKey === "string" ? sigs.pkpPublicKey : "",
        nonce: Date.now().toString(),
        resourceAbilityRequests: [
          {
            resource: new LitPKPResource("*"),
            ability: LIT_ABILITY.PKPSigning,
          },
        ],
      };

      try {
        await validateAuthParams(params);
        return true;
      } catch (error) {
        console.error("Auth params validation failed:", error);
        return false;
      }
    },
    []
  );

  const getSessionSigs = useCallback(async (): Promise<SessionSigs | null> => {
    try {
      // Check existing session
      if (sessionSigs && (await validateSession(sessionSigs))) {
        console.log("Using existing valid session");
        return sessionSigs;
      }

      // Clear any existing client connection
      if (litNodeClient) {
        await litNodeClient.disconnect();
        console.log("Disconnected existing Lit Node Client");
      }

      // Validate prerequisites
      if (!eoaSigner) {
        throw createSessionError(
          "EOA signer required for Lit authentication",
          "SIGNER_NOT_INITIALIZED"
        );
      }

      if (!eoaAddress) {
        throw createSessionError(
          "EOA address not available",
          "ADDRESS_NOT_AVAILABLE"
        );
      }

      // Initialize or get Lit client
      const nodeClient = await initLitClient();
      if (!nodeClient) {
        throw createSessionError(
          "Failed to initialize Lit Node Client",
          "LIT_CLIENT_ERROR"
        );
      }

      // Define resource abilities for PKP signing
      const resourceAbilities: LitResourceAbilityRequest[] = [
        {
          resource: new LitPKPResource("*"),
          ability: LIT_ABILITY.PKPSigning,
        },
      ];

      console.log("Preparing auth callback with EOA signer");

      const authNeededCallback: AuthCallback = async ({
        expiration,
        resources,
        resourceAbilityRequests,
        chain,
        nonce,
      }: AuthCallbackParams): Promise<AuthSig> => {
        try {
          if (!expiration || !resourceAbilityRequests) {
            throw new Error("Missing required auth parameters");
          }

          // Create SIWE message with recaps
          const toSign = await createSiweMessageWithRecaps({
            walletAddress: eoaAddress,
            chainId: 1, // Always use mainnet for SIWE
            resources: resourceAbilityRequests,
            expiration,
            uri: "https://lit.protocol",
            nonce: Date.now().toString(),
          });

          // Use EOA signer for SIWE message
          const authSig = await generateAuthSig({
            signer: eoaSigner as unknown as SignerLike,
            toSign,
            address: eoaAddress,
          });

          // Validate the generated auth signature
          const isValidSig = await validateAuthSig(authSig);
          if (!isValidSig) {
            throw createSessionError(
              "Invalid auth signature generated",
              "INVALID_AUTH_SIG"
            );
          }

          return authSig;
        } catch (error) {
          console.error("Auth callback failed:", error);
          throw error;
        }
      };

      // Get session sigs with the prepared callback
      const newSessionSigs = await nodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
        resourceAbilityRequests: resourceAbilities,
        authNeededCallback,
      });

      // Validate and store new session
      const isValid = await validateSession(newSessionSigs);
      if (!isValid) {
        throw createSessionError(
          "Invalid session signatures received",
          "INVALID_SESSION"
        );
      }

      setSessionSigs(newSessionSigs);
      setIsConnected(true);
      return newSessionSigs;
    } catch (error) {
      console.error("Failed to get session signatures:", error);
      setSessionSigs(null);
      return null;
    }
  }, [
    eoaSigner,
    eoaAddress,
    litNodeClient,
    initLitClient,
    validateSession,
    sessionSigs,
  ]);

  return {
    sessionSigs,
    getSessionSigs,
    initLitClient,
    isConnected,
    isEOAMode: user?.type !== "sca",
  };
}
