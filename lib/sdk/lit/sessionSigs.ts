import { useCallback, useState } from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORKS, LitError, LIT_ABILITY } from "@lit-protocol/constants";
import { LitPKPResource } from "@lit-protocol/auth-helpers";
import type {
  AuthSig,
  AuthCallback,
  AuthCallbackParams,
  SignerLike,
  LitResourceAbilityRequest,
} from "@lit-protocol/types";
import { useUser } from "@account-kit/react";
import useModularAccount from "@/lib/hooks/useModularAccount";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { validateAuthSig, validateAuthParams } from "./types/auth";
import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";
import { usePKPMint } from "./usePKPMint";

const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface SessionError extends Error {
  code: string;
  details?: unknown;
}

export interface SessionSigs {
  [key: string]: AuthSig;
}

interface SessionSigsHook {
  getSessionSigs: () => Promise<SessionSigs | null>;
  initLitClient: () => Promise<LitNodeClient | null>;
  isConnected: boolean;
  isEOAMode: boolean;
}

interface PKPInfo {
  publicKey: string;
}

interface PKPMintHook {
  pkp: PKPInfo | null;
  mintPKP: () => Promise<unknown>;
}

function createSessionError(
  message: string,
  code: string,
  details?: unknown
): SessionError {
  const error = new Error(message) as SessionError;
  error.code = code;
  error.details = details;
  return error;
}

export function useSessionSigs(): SessionSigsHook {
  const { smartAccountClient: client } = useModularAccount();
  const user = useUser();
  const [litNodeClient, setLitNodeClient] = useState<LitNodeClient | null>(
    null
  );
  const [isEOAMode, setIsEOAMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { pkp } = usePKPMint() as PKPMintHook;

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

  const getSessionSigs = useCallback(async (): Promise<SessionSigs | null> => {
    try {
      // Validate prerequisites
      if (!client) {
        throw createSessionError(
          "Smart account client not initialized",
          "CLIENT_NOT_INITIALIZED"
        );
      }

      if (!user?.type) {
        throw createSessionError(
          "User type not available",
          "USER_TYPE_NOT_AVAILABLE"
        );
      }

      // For SCA, we need PKP
      if (user.type === "sca" && !pkp?.publicKey) {
        throw createSessionError(
          "PKP not available for SCA authentication",
          "PKP_NOT_AVAILABLE"
        );
      }

      // Determine wallet type
      const walletType = user.type === "sca" ? "sca" : "eoa";
      setIsEOAMode(walletType === "eoa");

      console.log("Wallet type determined:", {
        type: walletType,
        userType: user.type,
        hasPKP: !!pkp?.publicKey,
        address: await client.getAddress(),
        timestamp: new Date().toISOString(),
      });

      // Initialize or get Lit client
      let nodeClient = litNodeClient;
      if (!nodeClient) {
        nodeClient = await initLitClient();
        if (!nodeClient) {
          throw createSessionError(
            "Failed to initialize Lit Node Client",
            "LIT_CLIENT_ERROR"
          );
        }
      }

      // Define resource abilities for PKP signing
      const resourceAbilities: LitResourceAbilityRequest[] = [
        {
          resource: new LitPKPResource("*"),
          ability: LIT_ABILITY.PKPSigning,
        },
      ];

      console.log("Preparing auth callback for wallet type:", walletType);
      const authNeededCallback: AuthCallback = async (
        params: AuthCallbackParams
      ): Promise<AuthSig> => {
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

        console.log("Auth callback triggered with params:", {
          uri: params.uri,
          expiration: params.expiration,
          resourceCount: params.resourceAbilityRequests.length,
          walletType,
        });

        try {
          // Get wallet address
          const walletAddress = await client.getAddress();
          if (!walletAddress) {
            throw createSessionError(
              "Failed to get wallet address",
              "WALLET_ADDRESS_ERROR"
            );
          }

          // Create SIWE message
          const toSign = await createSiweMessageWithRecaps({
            uri: params.uri,
            expiration: params.expiration,
            resources: params.resourceAbilityRequests,
            walletAddress,
            nonce: await nodeClient.getLatestBlockhash(),
            litNodeClient: nodeClient,
          });

          console.log("Generated SIWE message:", {
            message: toSign,
            length: toSign.length,
          });

          let authSig: AuthSig;

          if (walletType === "eoa") {
            // For EOA, use standard ECDSA signing
            authSig = await generateAuthSig({
              signer: client as unknown as SignerLike,
              toSign,
              address: walletAddress,
            });
          } else {
            // For SCA, use PKP signing
            try {
              if (!pkp?.publicKey) {
                throw new Error("PKP public key not available");
              }

              // Initialize PKP wallet with authContext
              const pkpWallet = new PKPEthersWallet({
                pkpPubKey: pkp.publicKey,
                rpc: "https://sepolia.base.org",
                litNodeClient: nodeClient,
                authContext: {
                  getSessionSigsProps: {
                    chain: "ethereum",
                    expiration: params.expiration,
                    resourceAbilityRequests: params.resourceAbilityRequests,
                    authNeededCallback,
                  },
                },
              });
              await pkpWallet.init();

              // Sign with PKP wallet
              const signature = await pkpWallet.signMessage(toSign);
              authSig = {
                sig: signature,
                derivedVia: "lit-pkp",
                signedMessage: toSign,
                address: walletAddress,
              };
            } catch (error) {
              console.error("Failed to sign with PKP:", error);
              throw createSessionError(
                "Failed to sign with PKP",
                "PKP_SIGNING_ERROR",
                { error }
              );
            }
          }

          // Log signature details
          console.log("Generated auth signature:", {
            type: walletType,
            hasSig: !!authSig?.sig,
            sigLength: authSig?.sig?.length,
            derivedVia: authSig?.derivedVia,
          });

          return authSig;
        } catch (error) {
          console.error("Auth callback failed:", {
            error,
            message: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      };

      // Get session sigs with the prepared callback
      const sessionSigs = await nodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
        resourceAbilityRequests: resourceAbilities,
        authNeededCallback,
      });

      setIsConnected(true);
      return sessionSigs;
    } catch (error) {
      console.error("Failed to get session signatures:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
      setIsConnected(false);
      throw error;
    }
  }, [client, litNodeClient, initLitClient, user?.type, pkp?.publicKey]);

  return {
    getSessionSigs,
    initLitClient,
    isConnected,
    isEOAMode,
  };
}
