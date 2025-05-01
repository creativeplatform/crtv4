import { useCallback, useEffect, useState } from "react";
import { useUser, useSmartAccountClient } from "@account-kit/react";
import { createPublicClient, http, fallback } from "viem";
import { base } from "viem/chains";

// Lock addresses from your configuration
const LOCK_ADDRESSES = {
  BASE_CREATIVE_PASS: "0xf7c4cd399395d80f9d61fde833849106775269c6",
  BASE_CREATIVE_PASS_2: "0x13b818daf7016b302383737ba60c3a39fef231cf",
  BASE_CREATIVE_PASS_3: "0x9c3744c96200a52d05a630d4aec0db707d7509be",
} as const;

const UNLOCK_ABI = [
  {
    inputs: [{ name: "_tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "owner", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Use multiple RPC endpoints for redundancy
const client = createPublicClient({
  chain: base,
  transport: fallback([
    http("https://mainnet.base.org"),
    http("https://base.llamarpc.com"),
    http("https://base.meowrpc.com"),
  ]),
  batch: {
    multicall: true,
  },
});

interface MembershipStatus {
  isVerified: boolean;
  hasMembership: boolean;
  isLoading: boolean;
  error: Error | null;
  membershipDetails?: {
    lockAddress: string;
    balance: bigint;
  }[];
}

export function useMembershipVerification() {
  const user = useUser();
  const { client: accountKitClient } = useSmartAccountClient({});
  const [status, setStatus] = useState<MembershipStatus>({
    isVerified: false,
    hasMembership: false,
    isLoading: true,
    error: null,
  });

  const verifyMembership = useCallback(async (address: string) => {
    try {
      // Check membership for each lock using multicall
      const membershipPromises = Object.entries(LOCK_ADDRESSES).map(
        async ([key, lockAddress]) => {
          try {
            const result = (await client.readContract({
              address: lockAddress as `0x${string}`,
              abi: UNLOCK_ABI,
              functionName: "balanceOf",
              args: [address as `0x${string}`],
            })) as bigint;

            return {
              lockAddress,
              balance: result,
            };
          } catch (error) {
            console.error(`Error checking balance for ${lockAddress}:`, error);
            return {
              lockAddress,
              balance: BigInt(0),
            };
          }
        }
      );

      const memberships = await Promise.all(membershipPromises);
      const hasMembership = memberships.some(
        ({ balance }) => balance > BigInt(0)
      );

      setStatus({
        isVerified: true,
        hasMembership,
        isLoading: false,
        error: null,
        membershipDetails: memberships,
      });
    } catch (error) {
      console.error("Error verifying membership:", error);
      setStatus({
        isVerified: false,
        hasMembership: false,
        isLoading: false,
        error: error as Error,
      });
    }
  }, []);

  useEffect(() => {
    const checkMembership = async () => {
      // Reset status when no user
      if (!user) {
        setStatus({
          isVerified: false,
          hasMembership: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        // For EOA users, check their address directly
        if (user.type === "eoa" && user.address) {
          await verifyMembership(user.address);
          return;
        }

        // For Account Kit users, check the SCA address
        if (accountKitClient?.account?.address) {
          await verifyMembership(accountKitClient.account.address);
          return;
        }

        // If we have a user but no valid address to check, set not verified
        setStatus({
          isVerified: false,
          hasMembership: false,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error in checkMembership:", error);
        setStatus({
          isVerified: false,
          hasMembership: false,
          isLoading: false,
          error: error as Error,
        });
      }
    };

    checkMembership();
  }, [user, accountKitClient?.account?.address, verifyMembership]);

  return status;
}
