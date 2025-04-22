import { useCallback, useState } from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import type {
  AuthSig,
  AuthCallback,
  AuthCallbackParams,
} from "@lit-protocol/types";
import { useUser } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/useModularAccount";
import type { AuthNeededParams } from "./types/auth";
import { validateAuthParams, validateAuthSig } from "./types/auth";

const LIT_NETWORK = "datil-dev";
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface SessionSigs {
  [key: string]: AuthSig;
}

interface SessionError extends Error {
  code?: string;
  details?: unknown;
}

function createSessionError(
  message: string,
  code?: string,
  details?: unknown
): SessionError {
  const error = new Error(message) as SessionError;
  error.code = code;
  error.details = details;
  return error;
}

export function useSessionSigs() {
  const { smartAccountClient: client } = useModularAccount();
  const user = useUser();
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(
    null
  );

  const initLitClient = useCallback(async () => {
    try {
      console.log("Initializing Lit Node Client...");
      const newClient = new LitNodeClient({
        litNetwork: LIT_NETWORK,
        debug: true,
      });

      await newClient.connect();
      console.log("Lit Node Client connected successfully");

      setLitNodeClient(newClient);
      return newClient;
    } catch (error) {
      const sessionError = createSessionError(
        "Failed to initialize Lit Node Client",
        "LIT_CLIENT_INIT_ERROR",
        {
          error,
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        }
      );
      console.error(sessionError);
      throw sessionError;
    }
  }, []);

  const getSessionSigs = useCallback(async (): Promise<SessionSigs | null> => {
    try {
      // Validate prerequisites
      if (!client) {
        throw createSessionError(
          "Smart account client not initialized",
          "CLIENT_NOT_INITIALIZED"
        );
      }

      if (user?.type !== "sca") {
        throw createSessionError(
          "Invalid user type for session signatures",
          "INVALID_USER_TYPE",
          { userType: user?.type }
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

      console.log("Getting session key...");
      const sessionKeyPair = nodeClient.getSessionKey();
      if (!sessionKeyPair) {
        throw createSessionError(
          "Failed to generate session key pair",
          "SESSION_KEY_ERROR"
        );
      }

      // Define resource abilities for PKP signing
      const resourceAbilities = [
        {
          resource: new LitPKPResource("*"),
          ability: LIT_ABILITY.PKPSigning,
        },
      ];

      console.log("Preparing auth callback...");
      const authNeededCallback: AuthCallback = async (
        params: AuthCallbackParams
      ): Promise<AuthSig> => {
        console.log("Auth callback triggered with params:", {
          uri: params.uri,
          expiration: params.expiration,
          resourceCount: params.resourceAbilityRequests?.length,
        });

        try {
          // 1. Basic parameter validation
          if (
            !params.uri ||
            !params.expiration ||
            !params.resourceAbilityRequests
          ) {
            throw createSessionError(
              "Missing required auth parameters",
              "INVALID_AUTH_PARAMS"
            );
          }

          // 2. Get wallet address
          const walletAddress = await client.getAddress();
          if (!walletAddress) {
            throw createSessionError(
              "Failed to get wallet address",
              "WALLET_ADDRESS_ERROR"
            );
          }

          // 3. Sign the session key
          const response = await nodeClient.signSessionKey({
            sessionKey: sessionKeyPair,
            statement:
              params.statement || "Sign in with Ethereum to use Lit Protocol",
            authMethods: [
              {
                authMethodType: 1,
                accessToken: JSON.stringify({
                  t: Date.now(),
                  address: walletAddress,
                }),
              },
            ],
            expiration: params.expiration,
            resources: params.resourceAbilityRequests,
            chainId: 1,
          });

          // 4. Validate response
          if (!response?.authSig) {
            throw createSessionError(
              "No auth signature returned",
              "AUTH_SIG_ERROR"
            );
          }

          // 5. Ensure signature has 0x prefix
          if (!response.authSig.sig?.startsWith("0x")) {
            response.authSig.sig = `0x${response.authSig.sig}`;
          }

          console.log("Session key signed successfully:", {
            hasSignature: !!response.authSig.sig,
            signatureFormat: response.authSig.sig?.slice(0, 10) + "...",
          });

          // 6. Validate final signature
          validateAuthSig(response.authSig);

          return response.authSig;
        } catch (error) {
          const sessionError = createSessionError(
            "Failed to sign session key",
            "SESSION_SIGNING_ERROR",
            {
              error,
              message: error instanceof Error ? error.message : "Unknown error",
              stack: error instanceof Error ? error.stack : undefined,
            }
          );
          console.error(sessionError);
          throw sessionError;
        }
      };

      console.log("Requesting session signatures...");
      const sessionSigs = await nodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
        resourceAbilityRequests: resourceAbilities,
        sessionKey: sessionKeyPair,
        authNeededCallback,
      });

      // Validate session signatures
      if (!sessionSigs || Object.keys(sessionSigs).length === 0) {
        throw createSessionError(
          "No session signatures generated",
          "NO_SESSION_SIGS"
        );
      }

      // Ensure all signatures are properly formatted
      Object.entries(sessionSigs).forEach(([key, sig]) => {
        if (sig.sig && !sig.sig.startsWith("0x")) {
          sessionSigs[key].sig = `0x${sig.sig}`;
        }
      });

      console.log("Session signatures obtained successfully:", {
        hasSignatures: !!sessionSigs,
        signatureKeys: Object.keys(sessionSigs),
        timestamp: new Date().toISOString(),
      });

      return sessionSigs;
    } catch (error) {
      console.error("Failed to get session signatures:", {
        error,
        code: (error as SessionError).code,
        message: error instanceof Error ? error.message : "Unknown error",
        details: (error as SessionError).details,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }, [client, user, litNodeClient, initLitClient]);

  return {
    getSessionSigs,
    initLitClient,
    isConnected: !!litNodeClient,
  };
}
