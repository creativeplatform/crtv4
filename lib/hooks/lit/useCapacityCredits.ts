/**
 * @file useCapacityCredits.ts
 * @description Custom React hook for managing Lit Protocol Capacity Credits
 *
 * This hook provides functionality to:
 * 1. Mint Capacity Credits NFT tokens for rate-limiting access to Lit Protocol
 * 2. Delegate capacity from these tokens to PKPs or specific Ethereum addresses
 *
 * @dev IMPORTANT IMPLEMENTATION NOTES:
 *
 * - Capacity Credits are NFTs that enable rate-limited access to Lit Protocol network
 * - Rate limits can be configured using requestsPerKilosecond, requestsPerDay, or requestsPerSecond
 * - The hook requires an initialized ModularAccount client from the useModularAccount hook
 * - All operations use strong typing with Zod validation to ensure param validity
 * - Error handling includes detailed error codes and logging for debugging
 * - The delegation process uses SIWE (Sign-In with Ethereum) messages for authorization
 * - Auth signatures are verified with comprehensive validation steps
 *
 * @usage Example usage:
 * ```tsx
 * const { mintCapacityCredits, delegateCapacity, isReady } = useCapacityCredits();
 *
 * // Mint new capacity credits
 * const mintResult = await mintCapacityCredits({
 *   requestsPerDay: 1000,
 *   daysUntilUTCMidnightExpiration: 30
 * });
 *
 * // Delegate capacity to a PKP
 * const delegateResult = await delegateCapacity({
 *   uses: "PKP Signing",
 *   capacityTokenId: mintResult.capacityTokenId,
 *   pkpInfo: {
 *     tokenId: "1",
 *     publicKey: "0x...",
 *     ethAddress: "0x..."
 *   }
 * });
 * ```
 *
 * @lastUpdated 2025-04-28
 */

import { useCallback } from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { z } from "zod";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { getContractClient } from "../../sdk/lit/lit-contracts";
import { getSigner } from "@account-kit/core";
import { config } from "@/config";
import {
  createSiweMessage,
  generateAuthSig,
  LitPKPResource,
  type LitResourceAbilityRequest,
} from "@lit-protocol/auth-helpers";
import type {
  AuthCallback,
  AuthCallbackParams,
  AuthSig,
  ILitResource,
} from "@lit-protocol/types";
import {
  validateAuthParams,
  validateAuthSig,
  validateSigner,
} from "../../sdk/lit/types/auth";
import { keccak256, toBytes, verifyMessage, recoverMessageAddress } from "viem";

// Error codes for capacity-related operations
export const CAPACITY_ERROR_CODES = {
  CONTRACT_CLIENT_ERROR: "CONTRACT_CLIENT_ERROR",
  MINT_ERROR: "MINT_ERROR",
  SIGNER_ERROR: "SIGNER_ERROR",
  INVALID_DELEGATEES: "INVALID_DELEGATEES",
  DELEGATION_SIG_ERROR: "DELEGATION_SIG_ERROR",
  INVALID_AUTH_PARAMS: "INVALID_AUTH_PARAMS",
  AUTH_SIG_ERROR: "AUTH_SIG_ERROR",
  LIT_CLIENT_ERROR: "LIT_CLIENT_ERROR",
} as const;

export type CapacityErrorCode =
  (typeof CAPACITY_ERROR_CODES)[keyof typeof CAPACITY_ERROR_CODES];

// Zod schema for rate limit configuration
const CapacityCreditsConfigSchema = z
  .object({
    requestsPerKilosecond: z.number().optional(),
    requestsPerDay: z.number().optional(),
    requestsPerSecond: z.number().optional(),
    daysUntilUTCMidnightExpiration: z.number().min(1),
  })
  .refine(
    (data) => {
      // At least one rate limit must be specified
      return !!(
        data.requestsPerKilosecond ||
        data.requestsPerDay ||
        data.requestsPerSecond
      );
    },
    {
      message:
        "At least one rate limit (requestsPerKilosecond, requestsPerDay, or requestsPerSecond) must be specified",
    }
  );

// Zod schema for PKP information
const PKPInfoSchema = z.object({
  tokenId: z.string(),
  publicKey: z.string(),
  ethAddress: z.string(),
});

// Zod schema for delegation parameters
const DelegateCapacityParamsSchema = z
  .object({
    uses: z.string(),
    capacityTokenId: z.string(),
    pkpInfo: PKPInfoSchema.optional(),
    delegateeAddresses: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Either pkpInfo or delegateeAddresses must be provided
      return !!(data.pkpInfo || data.delegateeAddresses);
    },
    {
      message: "Either pkpInfo or delegateeAddresses must be provided",
    }
  );

export type CapacityCreditsConfig = z.infer<typeof CapacityCreditsConfigSchema>;
export type DelegateCapacityParams = z.infer<
  typeof DelegateCapacityParamsSchema
>;
export type PKPInfo = z.infer<typeof PKPInfoSchema>;

export interface CapacityCreditsResult {
  capacityTokenId: string;
  error?: string;
}

export interface DelegateCapacityResult {
  capacityDelegationAuthSig: {
    sig: string;
    derivedVia: string;
    signedMessage: string;
    address: string;
  } | null;
  error?: string;
}

export interface CapacityError extends Error {
  code: CapacityErrorCode;
  details?: unknown;
}

function createCapacityError(
  message: string,
  code: CapacityErrorCode,
  details?: unknown
): CapacityError {
  const error = new Error(message) as CapacityError;
  error.code = code;
  error.details = details;
  return error;
}

export interface UseCapacityCreditsResult {
  mintCapacityCredits: (
    config: CapacityCreditsConfig
  ) => Promise<CapacityCreditsResult>;
  delegateCapacity: (
    params: DelegateCapacityParams
  ) => Promise<DelegateCapacityResult>;
  isReady: boolean;
}

export function useCapacityCredits(): UseCapacityCreditsResult {
  const { smartAccountClient: client } = useModularAccount();

  const mintCapacityCredits = useCallback(
    async (config: CapacityCreditsConfig): Promise<CapacityCreditsResult> => {
      if (!client) {
        return {
          capacityTokenId: "",
          error: "Smart account client not initialized",
        };
      }

      try {
        // Validate config
        const validatedConfig = CapacityCreditsConfigSchema.parse(config);
        console.log("Minting capacity credits with config:", validatedConfig);

        // Initialize contract client with signer
        const contractClient = await getContractClient();
        if (!contractClient) {
          throw createCapacityError(
            "Failed to initialize contract client",
            CAPACITY_ERROR_CODES.CONTRACT_CLIENT_ERROR
          );
        }

        const { capacityTokenIdStr } =
          await contractClient.mintCapacityCreditsNFT({
            ...validatedConfig,
          });

        if (!capacityTokenIdStr) {
          throw createCapacityError(
            "No capacity token ID returned",
            CAPACITY_ERROR_CODES.MINT_ERROR
          );
        }

        console.log("Capacity credits minted successfully:", {
          tokenId: capacityTokenIdStr,
        });

        return { capacityTokenId: capacityTokenIdStr };
      } catch (error) {
        console.error("Failed to mint capacity credits:", {
          error,
          code: (error as CapacityError).code,
          message: error instanceof Error ? error.message : "Unknown error",
          details: (error as CapacityError).details,
        });

        return {
          capacityTokenId: "",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [client]
  );

  const delegateCapacity = useCallback(
    async (params: DelegateCapacityParams): Promise<DelegateCapacityResult> => {
      if (!client) {
        return {
          capacityDelegationAuthSig: null,
          error: "Smart account client not initialized",
        };
      }

      try {
        // 1. Validate parameters
        const validatedParams = DelegateCapacityParamsSchema.parse(params);
        console.log("Delegating capacity with params:", {
          uses: validatedParams.uses,
          capacityTokenId: validatedParams.capacityTokenId,
          hasPkpInfo: !!validatedParams.pkpInfo,
          delegateeCount: validatedParams.delegateeAddresses?.length,
        });

        // 2. Get dApp owner wallet
        const dAppOwnerWallet = getSigner(config);
        if (!dAppOwnerWallet) {
          throw createCapacityError(
            "No signer available",
            CAPACITY_ERROR_CODES.SIGNER_ERROR
          );
        }

        // 3. Initialize Lit Node Client
        const litNodeClient = new LitNodeClient({
          litNetwork: LIT_NETWORK.Datil,
          debug: true,
        });
        await litNodeClient.connect();

        // 4. Determine delegatee addresses
        const delegateeAddresses =
          validatedParams.delegateeAddresses ||
          (validatedParams.pkpInfo ? [validatedParams.pkpInfo.ethAddress] : []);

        if (delegateeAddresses.length === 0) {
          throw createCapacityError(
            "No delegatee addresses provided",
            CAPACITY_ERROR_CODES.INVALID_DELEGATEES
          );
        }

        // 5. Create capacity delegation auth sig
        const { capacityDelegationAuthSig } =
          await litNodeClient.createCapacityDelegationAuthSig({
            uses: validatedParams.uses,
            capacityTokenId: validatedParams.capacityTokenId,
            delegateeAddresses,
            dAppOwnerWallet,
          });

        if (!capacityDelegationAuthSig) {
          throw createCapacityError(
            "Failed to create capacity delegation signature",
            CAPACITY_ERROR_CODES.DELEGATION_SIG_ERROR
          );
        }

        // 6. Generate session signatures
        const resourceAbilities: LitResourceAbilityRequest[] = [
          {
            resource: new LitPKPResource("*"),
            ability: LIT_ABILITY.PKPSigning,
          },
        ];

        const expiration = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();

        const authNeededCallback: AuthCallback = async (
          params: AuthCallbackParams
        ): Promise<AuthSig> => {
          const startTime = Date.now();
          const timings: Record<string, number> = {};

          const logTiming = (step: string) => {
            timings[step] = Date.now() - startTime;
            console.log(`Timing - ${step}:`, timings[step], "ms");
          };

          // Initial debug log with full params and environment context
          console.log("Auth callback triggered with context:", {
            network: LIT_NETWORK.Datil,
            timestamp: new Date().toISOString(),
            params: {
              uri: params.uri,
              expiration: params.expiration,
              statement: params.statement,
              resources: params.resourceAbilityRequests?.map((r) => ({
                resource: r.resource.toString(),
                ability: r.ability,
                type: r.resource.constructor.name,
              })),
            },
            resourceDetails: params.resourceAbilityRequests?.reduce(
              (acc, r) => {
                acc[r.ability] = {
                  resourceType: r.resource.constructor.name,
                  resourceString: r.resource.toString(),
                  abilityName: r.ability,
                };
                return acc;
              },
              {} as Record<string, any>
            ),
          });

          try {
            // 1. Basic parameter validation with detailed error
            if (
              !params.uri ||
              !params.expiration ||
              !params.resourceAbilityRequests
            ) {
              const missingParams = {
                uri: !params.uri,
                expiration: !params.expiration,
                resourceAbilityRequests: !params.resourceAbilityRequests,
              };
              console.error("Missing required auth parameters:", missingParams);
              throw createCapacityError(
                `Missing required auth parameters: ${Object.entries(
                  missingParams
                )
                  .filter(([_, missing]) => missing)
                  .map(([param]) => param)
                  .join(", ")}`,
                CAPACITY_ERROR_CODES.INVALID_AUTH_PARAMS
              );
            }
            logTiming("paramValidation");

            // 2. Validate signer with detailed logging
            console.log("Validating signer capabilities:", {
              hasAddress: typeof dAppOwnerWallet.getAddress === "function",
              hasSignMessage: typeof dAppOwnerWallet.signMessage === "function",
              type: dAppOwnerWallet.constructor.name,
            });

            try {
              const signerAddress = await dAppOwnerWallet.getAddress();

              // Verify signer has required methods
              if (typeof dAppOwnerWallet.signMessage !== "function") {
                throw createCapacityError(
                  "Signer missing required signMessage method",
                  CAPACITY_ERROR_CODES.SIGNER_ERROR,
                  { signerType: dAppOwnerWallet.constructor.name }
                );
              }

              console.log("Signer validation:", {
                address: signerAddress,
                type: dAppOwnerWallet.constructor.name,
                hasRequiredMethods: true,
              });

              await validateSigner(dAppOwnerWallet);
            } catch (signerError) {
              console.error("Signer validation failed:", {
                error: signerError,
                message:
                  signerError instanceof Error
                    ? signerError.message
                    : "Unknown error",
                type: dAppOwnerWallet.constructor.name,
              });
              throw createCapacityError(
                "Signer validation failed",
                CAPACITY_ERROR_CODES.SIGNER_ERROR,
                { signerError }
              );
            }
            logTiming("signerValidation");

            // 3. Get nonce and log details
            const nonce = await litNodeClient.getLatestBlockhash();
            console.log("Generated nonce:", {
              value: nonce,
              timestamp: Date.now(),
              network: LIT_NETWORK.Datil,
            });
            logTiming("nonceGeneration");

            // 4. Create SIWE message with detailed logging
            console.log("Creating SIWE message with params:", {
              uri: params.uri,
              expiration: params.expiration,
              resourceCount: params.resourceAbilityRequests.length,
              walletAddress: await dAppOwnerWallet.getAddress(),
              nonce,
            });

            const toSign = await createSiweMessage({
              uri: params.uri,
              expiration: params.expiration,
              resources: params.resourceAbilityRequests,
              walletAddress: await dAppOwnerWallet.getAddress(),
              nonce,
              litNodeClient,
            });

            // Enhanced SIWE message logging
            console.log("SIWE message details:", {
              fullMessage: toSign,
              messageLength: toSign.length,
              messageComponents: {
                domain: toSign.split(" ")[0],
                statement: toSign.includes("Statement:")
                  ? toSign.split("Statement: ")[1]?.split("\n")[0]
                  : "No statement",
                uri: params.uri,
                version: toSign.includes("Version: ")
                  ? toSign.split("Version: ")[1]?.split("\n")[0]
                  : "Unknown",
                chainId: toSign.includes("Chain ID: ")
                  ? toSign.split("Chain ID: ")[1]?.split("\n")[0]
                  : "Unknown",
                nonce: toSign.includes("Nonce: ")
                  ? toSign.split("Nonce: ")[1]?.split("\n")[0]
                  : "Unknown",
                issuedAt: toSign.includes("Issued At: ")
                  ? toSign.split("Issued At: ")[1]?.split("\n")[0]
                  : "Unknown",
                expirationTime: toSign.includes("Expiration Time: ")
                  ? toSign.split("Expiration Time: ")[1]?.split("\n")[0]
                  : "Unknown",
                resources: toSign.includes("resources:")
                  ? toSign.split("resources:")[1]?.trim()
                  : "No resources",
              },
            });

            // Calculate and log message hash for verification
            const messageBytes = toBytes(toSign);
            const messageHash = keccak256(messageBytes);
            console.log("SIWE message hash details:", {
              messageHash,
              messageString: toSign,
              messageLength: toSign.length,
              hashingMethod: "keccak256",
            });

            // 5. Generate auth signature with validation
            console.log("Generating auth signature...");
            const authSig = await generateAuthSig({
              signer: dAppOwnerWallet,
              toSign,
            });
            logTiming("signatureGeneration");

            // Validate signature format and content
            if (!authSig) {
              throw createCapacityError(
                "Failed to generate auth signature - signature is null",
                CAPACITY_ERROR_CODES.AUTH_SIG_ERROR
              );
            }

            // Log signer details for debugging provider-specific issues
            const signerType = dAppOwnerWallet.constructor.name;
            const signerProvider =
              (dAppOwnerWallet as any).provider?.constructor?.name || "Unknown";
            console.log("Signer details:", {
              type: signerType,
              provider: signerProvider,
              hasProvider: !!(dAppOwnerWallet as any).provider,
              capabilities: {
                signMessage: typeof dAppOwnerWallet.signMessage === "function",
                getAddress: typeof dAppOwnerWallet.getAddress === "function",
                connect: typeof (dAppOwnerWallet as any).connect === "function",
              },
            });

            // Ensure signature has 0x prefix and validate format
            if (!authSig.sig.startsWith("0x")) {
              console.warn("Adding 0x prefix to signature");
              authSig.sig = `0x${authSig.sig}`;
            }

            // Enhanced signature format validation
            const expectedLength = 132;
            if (authSig.sig.length !== expectedLength) {
              console.warn("Unexpected signature length:", {
                length: authSig.sig.length,
                expected: expectedLength,
                signature: authSig.sig,
                truncatedSig: `${authSig.sig.slice(
                  0,
                  10
                )}...${authSig.sig.slice(-10)}`,
                isHex: /^0x[0-9a-fA-F]*$/.test(authSig.sig),
              });
            }

            // Get and normalize signer address
            const signerAddress = await dAppOwnerWallet.getAddress();
            const normalizedSignerAddress = signerAddress.toLowerCase();

            console.log("Preparing signature verification:", {
              messageToVerify: toSign,
              messageHash,
              signature: {
                full: authSig.sig,
                truncated: `${authSig.sig.slice(0, 10)}...${authSig.sig.slice(
                  -10
                )}`,
                length: authSig.sig.length,
              },
              signer: {
                original: signerAddress,
                normalized: normalizedSignerAddress,
                type: signerType,
                provider: signerProvider,
              },
            });

            try {
              // Recover and normalize the address from the signature
              const recoveredAddress = await recoverMessageAddress({
                message: toSign,
                signature: authSig.sig as `0x${string}`,
              });
              const normalizedRecoveredAddress = recoveredAddress.toLowerCase();

              console.log("Address comparison:", {
                recovered: {
                  original: recoveredAddress,
                  normalized: normalizedRecoveredAddress,
                },
                expected: {
                  original: signerAddress,
                  normalized: normalizedSignerAddress,
                },
                match: normalizedRecoveredAddress === normalizedSignerAddress,
              });

              if (normalizedRecoveredAddress !== normalizedSignerAddress) {
                console.error(
                  "Signature verification failed - address mismatch:",
                  {
                    recovered: {
                      address: recoveredAddress,
                      normalized: normalizedRecoveredAddress,
                    },
                    expected: {
                      address: signerAddress,
                      normalized: normalizedSignerAddress,
                    },
                    signature: {
                      value: authSig.sig,
                      length: authSig.sig.length,
                      prefix: authSig.sig.slice(0, 10),
                    },
                    message: {
                      value: toSign,
                      hash: messageHash,
                    },
                  }
                );
                throw createCapacityError(
                  "Signature verification failed - address mismatch",
                  CAPACITY_ERROR_CODES.AUTH_SIG_ERROR,
                  {
                    recoveredAddress,
                    expectedAddress: signerAddress,
                    normalizedRecovered: normalizedRecoveredAddress,
                    normalizedExpected: normalizedSignerAddress,
                  }
                );
              }

              // Log successful verification with comprehensive details
              console.log("Signature verified successfully:", {
                addresses: {
                  recovered: recoveredAddress,
                  expected: signerAddress,
                  normalizedMatch:
                    normalizedRecoveredAddress === normalizedSignerAddress,
                },
                signature: {
                  length: authSig.sig.length,
                  isHex: /^0x[0-9a-fA-F]*$/.test(authSig.sig),
                },
                message: {
                  length: toSign.length,
                  hash: messageHash,
                },
                signer: {
                  type: signerType,
                  provider: signerProvider,
                },
              });
            } catch (verificationError) {
              // Enhanced error logging with full stack trace
              console.error("Signature verification error:", {
                error: {
                  message:
                    verificationError instanceof Error
                      ? verificationError.message
                      : "Unknown error",
                  stack:
                    verificationError instanceof Error
                      ? verificationError.stack
                      : undefined,
                  type: verificationError?.constructor?.name,
                },
                signature: {
                  value: authSig.sig,
                  length: authSig.sig.length,
                  isHex: /^0x[0-9a-fA-F]*$/.test(authSig.sig),
                },
                message: {
                  value: toSign,
                  hash: messageHash,
                },
                signer: {
                  address: signerAddress,
                  type: signerType,
                  provider: signerProvider,
                },
              });
              throw createCapacityError(
                "Failed to verify signature",
                CAPACITY_ERROR_CODES.AUTH_SIG_ERROR,
                {
                  verificationError,
                  stack:
                    verificationError instanceof Error
                      ? verificationError.stack
                      : undefined,
                }
              );
            }

            return authSig;
          } catch (error) {
            // Enhanced error logging
            console.error("Auth callback failed:", {
              error,
              code: (error as CapacityError).code,
              message: error instanceof Error ? error.message : "Unknown error",
              details: (error as CapacityError).details,
              stack: error instanceof Error ? error.stack : undefined,
              timings,
            });
            throw error;
          }
        };

        // 7. Generate session signatures
        await litNodeClient.getSessionSigs({
          chain: "ethereum",
          expiration,
          resourceAbilityRequests: resourceAbilities,
          authNeededCallback,
          capacityDelegationAuthSig,
        });

        console.log("Capacity delegation completed successfully:", {
          delegateeCount: delegateeAddresses.length,
          uses: validatedParams.uses,
          expiration,
        });

        return { capacityDelegationAuthSig };
      } catch (error) {
        console.error("Delegation error:", {
          error,
          code: (error as CapacityError).code,
          message: error instanceof Error ? error.message : "Unknown error",
          details: (error as CapacityError).details,
        });

        return {
          capacityDelegationAuthSig: null,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [client]
  );

  return {
    mintCapacityCredits,
    delegateCapacity,
    isReady: !!client,
  };
}
