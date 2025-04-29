/**
 * @file sessionSigs.ts
 * @description Manages Lit Protocol session signatures for secure PKP interactions
 *
 * This module provides hooks and utilities for generating, validating, and managing
 * session signatures used for authenticating with the Lit Protocol network. Session
 * signatures allow applications to interact with PKPs (Programmable Key Pairs) without
 * requiring users to sign every transaction.
 *
 * Key features:
 * - Session signature generation and validation
 * - Integration with EOA signers for authentication
 * - Automatic session renewal and expiration handling
 * - Support for Lit Protocol resource-ability requests
 * - Error handling with detailed error codes
 *
 * Usage:
 * ```tsx
 * const { sessionSigs, getSessionSigs, isConnected } = useSessionSigs();
 *
 * // Generate new session signatures using a PKP public key
 * const sigs = await getSessionSigs(pkpPublicKey);
 *
 * // Use session signatures for PKP operations
 * if (sigs) {
 *   // Use sigs with Lit Protocol operations
 * }
 * ```
 *
 * @dev Sessions expire after 24 hours (SESSION_EXPIRY constant)
 * @dev Always validate session signatures before use
 * @dev Uses SIWE (Sign-In with Ethereum) with recaps for authentication
 */

import { useCallback, useState, useEffect } from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_ERROR, LIT_ABILITY, LIT_NETWORK } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import type {
  AuthSig,
  AuthCallback,
  AuthCallbackParams,
  SignerLike,
  LitResourceAbilityRequest,
  SessionSigsMap,
} from "@lit-protocol/types";
import { useUser } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { validateAuthSig, validateAuthParams, SessionSigs } from "./types/auth";
import { useEoaSigner } from "@/lib/hooks/lit/useEoaSigner";

const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CONNECTION_TIMEOUT = 15000; // 15 seconds for connection timeout
const MAX_RETRIES = 3;

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
  const { smartAccountClient } = useModularAccount();
  const { signer: eoaSigner, address: eoaAddress } = useEoaSigner();
  const user = useUser();
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [sessionSigs, setSessionSigs] = useState<SessionSigs | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [litNetwork, setLitNetwork] = useState(LIT_NETWORK.DatilDev);

  // Auto-initialize the Lit client when EOA signer is available
  useEffect(() => {
    if (
      eoaSigner &&
      !litNodeClient &&
      !isConnecting &&
      retryCount < MAX_RETRIES
    ) {
      (async () => {
        try {
          await initLitClient();
        } catch (error) {
          console.error("Auto-initialization of Lit client failed:", error);
        }
      })();
    }
  }, [eoaSigner, litNodeClient, isConnecting, retryCount]);

  const initLitClient = useCallback(async (): Promise<LitNodeClient | null> => {
    if (isConnecting) return null;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      console.log("Initializing Lit client with network:", litNetwork);

      // Clean up any existing connection
      if (litNodeClient) {
        try {
          await litNodeClient.disconnect();
        } catch (err) {
          console.warn("Error disconnecting existing Lit client:", err);
        }
      }

      // Create and connect a new client with timeout
      const client = new LitNodeClient({
        litNetwork,
        debug: process.env.NODE_ENV !== "production",
      });

      const connectionPromise = client.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Connection timeout")),
          CONNECTION_TIMEOUT
        );
      });

      await Promise.race([connectionPromise, timeoutPromise]);

      console.log("Lit client connected successfully");
      setLitNodeClient(client);
      setIsConnected(true);
      setRetryCount(0);
      return client;
    } catch (error) {
      console.error("Failed to initialize Lit client:", error);
      setConnectionError(
        error instanceof Error ? error : new Error("Unknown connection error")
      );

      // Increment retry count and consider trying a different network
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (newRetryCount >= MAX_RETRIES) {
        console.warn(
          "Maximum retry attempts reached for Lit client initialization"
        );
      }

      // Switch networks on retry
      if (litNetwork === LIT_NETWORK.DatilDev) {
        setLitNetwork(LIT_NETWORK.DatilDev);
      }

      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [litNodeClient, isConnecting, retryCount, litNetwork]);

  const validateSession = useCallback(
    async (sigs: SessionSigs, pkpPublicKey: string): Promise<boolean> => {
      if (!sigs || typeof sigs.expiration !== "string") return false;
      if (!pkpPublicKey) return false;

      try {
        // Check expiration with 5-minute buffer to prevent edge cases
        const expiration = new Date(sigs.expiration).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() >= expiration - fiveMinutes) return false;

        // Validate auth parameters
        const params: ValidateAuthParams = {
          chain: "base-sepolia",
          expiration: sigs.expiration,
          pkpPublicKey,
          nonce: Date.now().toString(),
          resourceAbilityRequests: [
            {
              resource: new LitPKPResource(pkpPublicKey),
              ability: LIT_ABILITY.PKPSigning,
            },
          ],
        };

        validateAuthParams(params);

        // Verify the auth signature is present and well-formed
        if (!sigs.authSig || !sigs.authSig.sig || !sigs.authSig.signedMessage) {
          console.warn("Invalid auth signature structure in session");
          return false;
        }

        return true;
      } catch (error) {
        console.error("Session validation failed:", error);
        return false;
      }
    },
    []
  );

  const getSessionSigs = useCallback(
    async (pkpPublicKey: string): Promise<SessionSigs | null> => {
      try {
        console.log(
          "Getting session signatures for PKP:",
          pkpPublicKey ? pkpPublicKey.substring(0, 10) + "..." : "none"
        );

        if (!pkpPublicKey) {
          throw createSessionError(
            "PKP public key is required for session signature generation",
            "PKP_PUBLIC_KEY_REQUIRED"
          );
        }

        // Check existing session
        if (sessionSigs && (await validateSession(sessionSigs, pkpPublicKey))) {
          console.log("Using existing valid session");
          return sessionSigs;
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
        const nodeClient = litNodeClient || (await initLitClient());
        if (!nodeClient) {
          throw createSessionError(
            "Failed to initialize Lit Node Client",
            "LIT_CLIENT_ERROR"
          );
        }

        // Define resource abilities for PKP signing (use provided PKP public key or wildcard)
        const resourceAbilities: LitResourceAbilityRequest[] = [
          {
            resource: new LitPKPResource(pkpPublicKey || "*"),
            ability: LIT_ABILITY.PKPSigning,
          },
        ];

        console.log(
          "Preparing auth callback with EOA signer, address:",
          eoaAddress
        );

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

            console.log("Generating SIWE message with recaps");

            // Create SIWE message with recaps
            const toSign = await createSiweMessageWithRecaps({
              walletAddress: eoaAddress,
              chainId: 1, // Always use mainnet for SIWE
              resources: resourceAbilityRequests,
              expiration,
              uri: "https://lit.protocol",
              nonce: nonce || Date.now().toString(),
            });

            console.log("SIWE message created, generating auth signature");

            // Use EOA signer for SIWE message
            const authSig = await generateAuthSig({
              signer: eoaSigner as unknown as SignerLike,
              toSign,
              address: eoaAddress,
            });

            console.log("Auth signature generated, validating");

            // Validate the generated auth signature
            const isValidSig = await validateAuthSig(authSig);
            if (!isValidSig) {
              throw createSessionError(
                "Invalid auth signature generated",
                "INVALID_AUTH_SIG"
              );
            }

            console.log("Auth signature valid, returning");
            return authSig;
          } catch (error) {
            console.error("Auth callback failed:", error);
            throw error;
          }
        };

        // Get session sigs with the prepared callback
        console.log("Requesting session signatures from Lit Network");
        const sessionSigsMapResult = (await nodeClient.getSessionSigs({
          chain: "ethereum",
          expiration: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
          resourceAbilityRequests: resourceAbilities,
          authNeededCallback,
        })) as SessionSigsMap;

        // Extract needed values to construct a SessionSigs object
        // Get authSig from the session signatures map result
        const authSig = Object.values(sessionSigsMapResult)[0];
        const expiration = new Date(Date.now() + SESSION_EXPIRY).toISOString();

        // Construct a SessionSigs object from the SessionSigsMap
        const newSessionSigs: SessionSigs = {
          ...sessionSigsMapResult,
          authSig: authSig as AuthSig,
          expiration: expiration,
        };

        console.log("Session signatures received, validating");

        // Validate and store new session
        const isValid = await validateSession(newSessionSigs, pkpPublicKey);
        if (!isValid) {
          throw createSessionError(
            "Invalid session signatures received",
            "INVALID_SESSION"
          );
        }

        console.log("Session signatures valid and stored");
        setSessionSigs(newSessionSigs);
        setIsConnected(true);
        return newSessionSigs;
      } catch (error) {
        console.error("Failed to get session signatures:", error);
        setSessionSigs(null);
        return null;
      }
    },
    [
      eoaSigner,
      eoaAddress,
      litNodeClient,
      initLitClient,
      validateSession,
      sessionSigs,
    ]
  );

  const resetClient = useCallback(async () => {
    if (litNodeClient) {
      try {
        await litNodeClient.disconnect();
      } catch (err) {
        console.warn("Error disconnecting Lit client:", err);
      }
    }
    setLitNodeClient(null);
    setIsConnected(false);
    setConnectionError(null);
    setSessionSigs(null);
    setRetryCount(0);
  }, [litNodeClient]);

  return {
    sessionSigs,
    getSessionSigs,
    initLitClient,
    resetClient,
    isConnected,
    isConnecting,
    connectionError,
    isEOAMode: user?.type !== "sca",
  };
}
