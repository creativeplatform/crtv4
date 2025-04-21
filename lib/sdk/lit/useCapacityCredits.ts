import { useCallback } from "react";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { SignerLike } from "@lit-protocol/types";
import { z } from "zod";
import useModularAccount from "@/lib/hooks/useModularAccount";
import { getContractClient } from "./lit-contracts";
import { PKPMintInfo } from "./usePKPMint";
import { getSigner } from "@account-kit/core";
import { config } from "@/config";

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

const DelegateCapacityParamsSchema = z
  .object({
    uses: z.string(),
    capacityTokenId: z.string(),
    pkpInfo: z
      .object({
        tokenId: z.string(),
        publicKey: z.string(),
        ethAddress: z.string(),
      })
      .optional(),
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

interface CapacityCreditsResult {
  capacityTokenId: string;
  error?: string;
}

interface DelegateCapacityResult {
  capacityDelegationAuthSig: any; // Replace 'any' with proper type from LIT Protocol if available
  error?: string;
}

export function useCapacityCredits() {
  const { smartAccountClient: client } = useModularAccount();

  const mintCapacityCredits = useCallback(
    async (config: CapacityCreditsConfig): Promise<CapacityCreditsResult> => {
      if (!client)
        return { capacityTokenId: "", error: "Client not initialized" };

      try {
        // Validate config
        const validatedConfig = CapacityCreditsConfigSchema.parse(config);

        // Initialize contract client with signer
        const contractClient = await getContractClient();

        const { capacityTokenIdStr } =
          await contractClient.mintCapacityCreditsNFT({
            ...validatedConfig,
          });

        return { capacityTokenId: capacityTokenIdStr };
      } catch (error) {
        return {
          capacityTokenId: "",
          error: `Failed to mint capacity credits: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
    [client]
  );

  const delegateCapacity = useCallback(
    async (params: DelegateCapacityParams): Promise<DelegateCapacityResult> => {
      if (!client)
        return {
          capacityDelegationAuthSig: null,
          error: "Client not initialized",
        };

      try {
        const validatedParams = DelegateCapacityParamsSchema.parse(params);

        const dAppOwnerWallet = getSigner(config);
        if (!dAppOwnerWallet)
          return {
            capacityDelegationAuthSig: null,
            error: "No signer available",
          };

        const litNodeClient = new LitNodeClient({
          litNetwork: LIT_NETWORK.Datil,
        });
        await litNodeClient.connect();

        // Determine delegatee addresses
        const delegateeAddresses =
          validatedParams.delegateeAddresses ||
          (validatedParams.pkpInfo ? [validatedParams.pkpInfo.ethAddress] : []);

        const { capacityDelegationAuthSig } =
          await litNodeClient.createCapacityDelegationAuthSig({
            uses: validatedParams.uses,
            capacityTokenId: validatedParams.capacityTokenId,
            delegateeAddresses,
            dAppOwnerWallet,
          });

        return { capacityDelegationAuthSig };
      } catch (error) {
        return {
          capacityDelegationAuthSig: null,
          error: `Failed to delegate capacity: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
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
