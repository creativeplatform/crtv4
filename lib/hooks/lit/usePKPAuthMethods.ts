/**
 * @file usePKPAuthMethods.ts
 * @description React hook for managing Lit Protocol PKP (Programmable Key Pair) authentication methods.
 *
 * This hook provides functionality to:
 * - Add authentication methods to PKPs (e.g., WebAuthn, OAuth, etc.)
 * - Remove authentication methods from PKPs
 * - Retrieve all authentication methods associated with a PKP
 *
 * It supports two authentication flows:
 * 1. PKP Owner flow - where the PKP itself is the signer (requires pkpPublicKey)
 * 2. External Owner flow - where an external wallet owns the PKP
 *
 * @requires LitContracts from @lit-protocol/contracts-sdk
 * @requires PKPEthersWallet from @lit-protocol/pkp-ethers
 * @requires getSigner from @account-kit/core
 * @requires getLitClient for creating a Lit Protocol client instance
 *
 * @dev Notes:
 * - Auth methods are managed via the PKP Permissions contract
 * - Auth methods require scopes to define their permissions
 * - The hook uses Zod for runtime validation of configuration
 * - Transactions require proper gas configuration for Lit Network (default provided)
 * - Supports various authentication method types via the authMethodType hex identifier
 * - All contract operations are performed on the Lit Protocol Datil network
 *
 * Common auth method types:
 * - 0x0000000000000000000000000000000000000000000000000000000000000001: WebAuthn
 * - 0x0000000000000000000000000000000000000000000000000000000000000002: OAuth
 * - 0x0000000000000000000000000000000000000000000000000000000000000003: Discord
 * - 0x0000000000000000000000000000000000000000000000000000000000000004: Google
 *
 * Common scope values:
 * - 1: Sign any message
 * - 2: Sign any transaction
 * - 3: Sign any authentication message
 * - 4: Sign any PKP contract invocation
 */

import { LitContracts } from "@lit-protocol/contracts-sdk";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { PKPEthersWallet } from "@lit-protocol/pkp-ethers";
import { getSigner } from "@account-kit/core";
import { config } from "@/config";
import { useCallback } from "react";
import { z } from "zod";
import { getLitClient } from "../../sdk/lit/lit-client";
import { BytesLike } from "@ethersproject/bytes";
import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import type { Hex } from "viem";

const AuthMethodConfigSchema = z.object({
  pkpTokenId: z.string(),
  pkpPublicKey: z.string().optional(),
  isPkpOwner: z.boolean().default(false),
});

export type AuthMethodConfig = z.infer<typeof AuthMethodConfigSchema>;

interface AuthMethodStruct {
  authMethodType: Hex;
  id: string;
  userPubkey: BytesLike;
}

interface GasConfig {
  gasPriceGwei?: string;
  gasLimit?: number;
}

interface AddAuthMethodParams {
  config: AuthMethodConfig;
  authMethod: AuthMethodStruct;
  scopes: number[];
  gasConfig?: GasConfig;
}

interface RemoveAuthMethodParams {
  config: AuthMethodConfig;
  authMethod: AuthMethodStruct;
}

export function usePKPAuthMethods() {
  const initializeContracts = useCallback(
    async (authConfig: AuthMethodConfig) => {
      if (!authConfig) throw new Error("Auth config is required");

      const validatedConfig = AuthMethodConfigSchema.parse(authConfig);

      if (validatedConfig.isPkpOwner) {
        if (!validatedConfig.pkpPublicKey)
          throw new Error("PKP public key is required when PKP is owner");

        const pkpWallet = new PKPEthersWallet({
          pkpPubKey: validatedConfig.pkpPublicKey,
          litNodeClient: await getLitClient(),
        });
        await pkpWallet.init();

        const contractClient = new LitContracts({
          signer: pkpWallet,
          network: LIT_NETWORK.Datil,
        });
        await contractClient.connect();
        return contractClient;
      }

      const signer = getSigner(config);
      if (!signer) throw new Error("No signer available");

      const contractClient = new LitContracts({
        signer,
        network: LIT_NETWORK.Datil,
      });
      await contractClient.connect();
      return contractClient;
    },
    []
  );

  const addAuthMethod = useCallback(
    async ({ config, authMethod, scopes, gasConfig }: AddAuthMethodParams) => {
      if (!config?.pkpTokenId)
        return { success: false, error: "PKP token ID is required" };
      if (!authMethod?.authMethodType)
        return { success: false, error: "Auth method type is required" };
      if (!scopes?.length)
        return { success: false, error: "At least one scope is required" };

      try {
        const contractClient = await initializeContracts(config);
        const tx =
          await contractClient.pkpPermissionsContract.write.addPermittedAuthMethod(
            config.pkpTokenId,
            {
              authMethodType: authMethod.authMethodType,
              id: authMethod.id,
              userPubkey: authMethod.userPubkey || "0x",
            },
            scopes.map((scope) => BigNumber.from(scope)),
            {
              gasPrice: parseUnits(gasConfig?.gasPriceGwei || "0.001", "gwei"),
              gasLimit: gasConfig?.gasLimit || 400000,
            }
          );

        const receipt = await tx.wait();
        return { success: true, tx, receipt };
      } catch (error) {
        return {
          success: false,
          error: `Failed to add auth method: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    [initializeContracts]
  );

  const removeAuthMethod = useCallback(
    async ({ config, authMethod }: RemoveAuthMethodParams) => {
      if (!config?.pkpTokenId)
        return { success: false, error: "PKP token ID is required" };
      if (!authMethod?.authMethodType)
        return { success: false, error: "Auth method type is required" };

      try {
        const contractClient = await initializeContracts(config);
        const tx =
          await contractClient.pkpPermissionsContract.write.removePermittedAuthMethod(
            config.pkpTokenId,
            authMethod.authMethodType,
            authMethod.id
          );

        return { success: true, tx };
      } catch (error) {
        return {
          success: false,
          error: `Failed to remove auth method: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    [initializeContracts]
  );

  const getAuthMethods = useCallback(
    async (config: AuthMethodConfig) => {
      if (!config?.pkpTokenId)
        return { success: false, error: "PKP token ID is required" };

      try {
        const contractClient = await initializeContracts(config);
        const authMethods =
          await contractClient.pkpPermissionsContract.read.getPermittedAuthMethods(
            config.pkpTokenId
          );

        return { success: true, authMethods };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get auth methods: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    [initializeContracts]
  );

  return {
    addAuthMethod,
    removeAuthMethod,
    getAuthMethods,
  };
}
