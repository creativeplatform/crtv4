import { useCallback, useEffect, useState } from "react";
import { useUser } from "@account-kit/react";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Lock addresses from your configuration
const LOCK_ADDRESSES = {
  BASE_CREATIVE_PASS: "0xf7c4cd399395d80f9d61fde833849106775269c6",
  BASE_CREATIVE_PASS_2: "0x13b818daf7016b302383737ba60c3a39fef231cf",
  BASE_CREATIVE_PASS_3: "0x9c3744c96200a52d05a630d4aec0db707d7509be",
};

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

const client = createPublicClient({
  chain: base,
  transport: http(),
});

interface MembershipStatus {
  isVerified: boolean;
  hasMembership: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useMembershipVerification() {
  const user = useUser();
  const [status, setStatus] = useState<MembershipStatus>({
    isVerified: false,
    hasMembership: false,
    isLoading: true,
    error: null,
  });

  const verifyMembership = useCallback(async (address: string) => {
    try {
      // Check membership for each lock
      const membershipPromises = Object.values(LOCK_ADDRESSES).map(
        (lockAddress) =>
          client.readContract({
            address: lockAddress as `0x${string}`,
            abi: UNLOCK_ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          })
      );

      const memberships = await Promise.all(membershipPromises);
      const hasMembership = memberships.some((balance) => balance > 0n);

      setStatus({
        isVerified: true,
        hasMembership,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setStatus({
        isVerified: false,
        hasMembership: false,
        isLoading: false,
        error: error as Error,
      });
    }
  }, []);

  useEffect(() => {
    if (user?.address) {
      verifyMembership(user.address);
    } else {
      setStatus({
        isVerified: false,
        hasMembership: false,
        isLoading: false,
        error: null,
      });
    }
  }, [user?.address, verifyMembership]);

  return status;
}
