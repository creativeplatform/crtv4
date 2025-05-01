// services/unlock.ts
import { Web3Service } from "@unlock-protocol/unlock-js";
import PublicLockV14Json from "@unlock-protocol/contracts/dist/abis/PublicLock/PublicLockV14.json";
import {
  createPublicClient,
  http,
  fallback,
  type PublicClient,
  custom,
  getContract,
  type GetContractReturnType,
} from "viem";
import { base } from "@account-kit/infra";

// Use the official PublicLockV14 ABI from Unlock Protocol
const lockAbi = PublicLockV14Json.abi;

// Create a public client with fallback RPC endpoints for Base mainnet
const client = createPublicClient({
  chain: base,
  transport: fallback([
    http("https://mainnet.base.org"),
    http("https://base.g.alchemy.com/v2/demo"),
  ]),
  batch: {
    multicall: true,
  },
});

// Create a Viem-based provider for Web3Service
const provider = {
  async request(args: { method: string; params?: any[] }) {
    try {
      // @ts-ignore - client.request is typed differently but compatible
      return await client.request(args);
    } catch (error) {
      console.error("Provider request error:", error);
      throw error;
    }
  },
};

// Initialize Web3Service with Base chain configuration
const networks = {
  [base.id]: {
    provider,
    id: base.id,
    name: base.name,
    unlockAddress: "0xc0b4159e91e1f9f8adf1d3a9dd1d672c9d0c3f5f",
    publicLockLatestVersion: 14,
  },
};

const web3Service = new Web3Service(networks);

// Lock addresses configuration
export const LOCK_ADDRESSES = {
  BASE_CREATIVE_PASS: "0xf7c4cd399395d80f9d61fde833849106775269c6",
  BASE_CREATIVE_PASS_2: "0x13b818daf7016b302383737ba60c3a39fef231cf",
  BASE_CREATIVE_PASS_3: "0x9c3744c96200a52d05a630d4aec0db707d7509be",
} as const;

export type LockAddress = keyof typeof LOCK_ADDRESSES;
export type LockAddressValue = (typeof LOCK_ADDRESSES)[LockAddress];

export interface LockMetadata {
  name: string;
  description: string;
  image: string;
  externalUrl?: string;
  version?: number;
}

export interface KeyMetadata {
  tokenId: string;
  expiration: number;
  owner: string;
}

export interface MembershipError extends Error {
  code: string;
  context?: Record<string, unknown>;
}

type PublicLockContract = GetContractReturnType<typeof lockAbi, PublicClient>;

export class UnlockService {
  private client: PublicClient;

  constructor() {
    this.client = client;
  }

  private createError(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    return {
      message,
      code,
      details,
    };
  }

  private getContract(lockAddress: string): PublicLockContract {
    return getContract({
      address: lockAddress as `0x${string}`,
      abi: lockAbi,
      client: this.client,
    });
  }

  private async checkBalanceOf(
    lockAddress: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      console.log("Checking balance with chain:", {
        id: client.chain.id,
        name: client.chain.name,
      });

      const contract = this.getContract(lockAddress);

      // Use balanceOf as a quick check
      const balanceResult = await contract.read.balanceOf([
        userAddress as `0x${string}`,
      ]);
      const balance = BigInt(String(balanceResult));

      const hasBalance = balance > 0n;
      console.log("Balance check result:", {
        balance: balance.toString(),
        hasBalance,
      });

      return hasBalance;
    } catch (error) {
      console.error("Error checking balance:", error);
      throw this.createError(
        `Failed to check balance: ${(error as Error).message}`,
        "BALANCE_CHECK_ERROR",
        { lockAddress, userAddress, originalError: error }
      );
    }
  }

  private async getTokensOfOwner(
    lockAddress: string,
    userAddress: string
  ): Promise<bigint[]> {
    try {
      const contract = this.getContract(lockAddress);

      // Check if user has any valid keys
      const hasValidKey = await contract.read.getHasValidKey([
        userAddress as `0x${string}`,
      ]);

      if (!hasValidKey) {
        console.log("No valid key found for user");
        return [];
      }

      // Get balance of valid keys
      const balanceResult = await contract.read.balanceOf([
        userAddress as `0x${string}`,
      ]);
      const balance = BigInt(String(balanceResult));

      console.log(
        `Balance for ${userAddress} at ${lockAddress}:`,
        balance.toString()
      );

      return balance > 0n ? [1n] : []; // Return dummy token ID if user has balance
    } catch (error) {
      console.error(
        `Error getting tokens for ${userAddress} at ${lockAddress}:`,
        error
      );
      throw this.createError(
        `Failed to get tokens: ${(error as Error).message}`,
        "TOKEN_FETCH_ERROR",
        { lockAddress, userAddress, originalError: error }
      );
    }
  }

  async getNftMetadata(
    lockAddress: string,
    tokenId: string
  ): Promise<LockMetadata | null> {
    try {
      const contract = this.getContract(lockAddress);

      // Get the token URI
      const result = await contract.read.tokenURI([BigInt(tokenId)]);
      // The result should be a string, but let's handle it safely
      const tokenUri =
        result && typeof result === "object" && Array.isArray(result)
          ? result[0]?.toString()
          : String(result);

      if (!tokenUri) {
        console.warn(
          `No tokenURI found for token ${tokenId} at ${lockAddress}`
        );
        return null;
      }

      // Fetch metadata from the token URI
      const response = await fetch(tokenUri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const metadata = await response.json();

      return {
        name: metadata.name || "",
        description: metadata.description || "",
        image: metadata.image || "",
        externalUrl: metadata.external_url,
      };
    } catch (error) {
      console.error(
        `Error fetching NFT metadata for token ${tokenId} at ${lockAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get lock details including metadata
   */
  async getLock(lockAddress: string) {
    try {
      const contract = this.getContract(lockAddress);

      // Get basic lock details from the contract
      // You can add more contract calls here as needed
      return {
        address: lockAddress,
        // Add other lock details as needed
      };
    } catch (error) {
      console.error(`Error getting lock details for ${lockAddress}:`, error);
      throw this.createError(
        `Failed to get lock details: ${(error as Error).message}`,
        "LOCK_FETCH_ERROR",
        { lockAddress, originalError: error }
      );
    }
  }

  /**
   * Check if an address has a valid membership
   */
  async hasValidMembership(
    lockAddress: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      console.log(
        `Checking membership for ${userAddress} at lock ${lockAddress}`
      );

      const contract = this.getContract(lockAddress);

      // Use getHasValidKey which internally checks expiration and validity
      const hasValidKeyResult = await contract.read.getHasValidKey([
        userAddress as `0x${string}`,
      ]);
      const hasValidKey = Boolean(hasValidKeyResult);

      console.log("getHasValidKey result:", hasValidKey);

      return hasValidKey;
    } catch (error) {
      console.error(
        `Error checking membership for ${userAddress} at ${lockAddress}:`,
        error
      );
      throw this.createError(
        `Failed to check membership: ${(error as Error).message}`,
        "MEMBERSHIP_CHECK_ERROR",
        { lockAddress, userAddress, originalError: error }
      );
    }
  }

  /**
   * Get all memberships for an address across multiple locks
   */
  async getAllMemberships(userAddress: string) {
    console.log("Getting all memberships for address:", userAddress);

    if (!userAddress) {
      throw this.createError("User address is required", "INVALID_ADDRESS", {
        userAddress,
      });
    }

    const memberships = await Promise.all(
      Object.entries(LOCK_ADDRESSES).map(async ([name, address]) => {
        try {
          console.log(`Checking lock ${name} at ${address}`);
          const hasValid = await this.hasValidMembership(address, userAddress);

          // Only fetch lock details if membership is valid
          let lock = null;
          let tokenId = null;
          let metadata = null;

          if (hasValid) {
            try {
              // Get lock details
              lock = await this.getLock(address);

              // Get token IDs for the user
              const tokens = await this.getTokensOfOwner(address, userAddress);
              if (tokens.length > 0) {
                tokenId = tokens[0].toString();
                // Get metadata for the token
                metadata = await this.getNftMetadata(address, tokenId);
                if (metadata) {
                  lock = {
                    ...lock,
                    ...metadata,
                  };
                }
              }
            } catch (error) {
              console.warn(
                `Failed to get complete lock details for ${address}, continuing with basic membership info:`,
                error
              );
            }
          }

          console.log(`Lock ${name} valid:`, hasValid);

          return {
            name: name as LockAddress,
            address,
            isValid: hasValid,
            lock,
            tokenId,
          };
        } catch (error) {
          console.error(
            `Error getting membership details for ${address}:`,
            error
          );
          return {
            name: name as LockAddress,
            address,
            isValid: false,
            lock: null,
            tokenId: null,
          };
        }
      })
    );

    console.log("All memberships:", memberships);
    return memberships;
  }
}

// Export singleton instance
export const unlockService = new UnlockService();
