"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useSmartAccountClient } from "@account-kit/react";
import type { UseSmartAccountClientResult } from "@account-kit/react";
import {
  unlockService,
  type LockAddress,
  type LockAddressValue,
  type MembershipError,
  fetchLockAndKey,
} from "../../sdk/unlock/services";

export interface MembershipDetails {
  name: LockAddress;
  address: LockAddressValue;
  isValid: boolean;
  lock: any | null; // Type from Unlock Protocol
}

export interface MembershipStatus {
  isVerified: boolean;
  hasMembership: boolean;
  isLoading: boolean;
  error: MembershipError | null;
  membershipDetails?: MembershipDetails[];
  walletType?: "eoa" | "sca";
  walletAddress?: string;
}

export function useMembershipVerification() {
  const user = useUser();
  const accountKit = useSmartAccountClient({});
  const [status, setStatus] = useState<MembershipStatus>({
    isVerified: false,
    hasMembership: false,
    isLoading: true,
    error: null,
  });

  const verifyMembership = useCallback(
    async (address: string, walletType: "eoa" | "sca") => {
      try {
        // Get all memberships using Unlock Protocol's Web3Service
        const memberships = await unlockService.getAllMemberships(address);

        const hasMembership = memberships.some(({ isValid }) => isValid);

        // Log valid memberships for debugging
        if (hasMembership) {
          const validMemberships = memberships.filter(({ isValid }) => isValid);
        }

        setStatus({
          isVerified: true,
          hasMembership,
          isLoading: false,
          error: null,
          membershipDetails: memberships,
          walletType,
          walletAddress: address,
        });
      } catch (error) {
        const membershipError = error as MembershipError;
        setStatus({
          isVerified: false,
          hasMembership: false,
          isLoading: false,
          error: membershipError,
          membershipDetails: [],
          walletType,
          walletAddress: address,
        });
      }
    },
    []
  );

  useEffect(() => {
    const checkMembership = async () => {
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
          await verifyMembership(user.address, "eoa");
          return;
        }

        // For Account Kit users, wait for client and check the SCA address
        if (user.type !== "eoa") {
          if (!accountKit.client?.account?.address) {
            return;
          }

          await verifyMembership(accountKit.client.account.address, "sca");
          return;
        }

        setStatus({
          isVerified: false,
          hasMembership: false,
          isLoading: false,
          error: {
            name: "Error",
            message: "No valid address found for verification",
            code: "NO_VALID_ADDRESS",
          } as MembershipError,
        });
      } catch (error) {
        const membershipError = error as MembershipError;
        setStatus({
          isVerified: false,
          hasMembership: false,
          isLoading: false,
          error: membershipError,
        });
      }
    };

    checkMembership();
  }, [user, accountKit, verifyMembership]);

  return status;
}

export interface UseUnlockNFTParams {
  lockAddress: string;
  userAddress: string;
  network: number;
}

export function useUnlockNFT({
  lockAddress,
  userAddress,
  network,
}: UseUnlockNFTParams) {
  const [data, setData] = useState<{ lock: any; key: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lockAddress || !userAddress) return;
    setIsLoading(true);
    fetchLockAndKey({ lockAddress, userAddress, network })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [lockAddress, userAddress, network]);

  const DEBUG = process.env.NODE_ENV === "development";
  if (DEBUG) console.log("message", data);

  return { data, isLoading, error };
}

interface UseUnlockNFTApiParams {
  lockAddress: string;
  userAddress: string;
  network: number;
  enabled?: boolean; // Optional: only fetch if true
}

interface UnlockNFTApiResult {
  data: { lock: any; key: any } | null;
  isLoading: boolean;
  error: string | null;
}

export function useUnlockNFTApi({
  lockAddress,
  userAddress,
  network,
  enabled = true,
}: UseUnlockNFTApiParams): UnlockNFTApiResult {
  const [data, setData] = useState<{ lock: any; key: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !lockAddress || !userAddress) return;
    setIsLoading(true);
    setError(null);
    fetch("/api/unlock-nft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lockAddress, userAddress, network }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [lockAddress, userAddress, network, enabled]);

  return { data, isLoading, error };
}
