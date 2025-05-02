"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useSmartAccountClient } from "@account-kit/react";
import type { UseSmartAccountClientResult } from "@account-kit/react";
import {
  unlockService,
  type LockAddress,
  type LockAddressValue,
  type MembershipError,
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
        console.log(
          `Verifying ${walletType.toUpperCase()} membership for address:`,
          address
        );

        if (!address) {
          throw new Error("No address provided for verification");
        }

        // Get all memberships using Unlock Protocol's Web3Service
        const memberships = await unlockService.getAllMemberships(address);
        console.log(
          `${walletType.toUpperCase()} memberships found:`,
          memberships
        );

        const hasMembership = memberships.some(({ isValid }) => isValid);
        console.log(
          `${walletType.toUpperCase()} has valid membership:`,
          hasMembership
        );

        // Log valid memberships for debugging
        if (hasMembership) {
          const validMemberships = memberships.filter(({ isValid }) => isValid);
          console.log(
            "Valid memberships:",
            validMemberships.map((m) => ({
              name: m.name,
              address: m.address,
              lockDetails: m.lock,
            }))
          );
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
        console.error(`Error verifying ${walletType} membership:`, error);
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
      console.log("Checking membership with state:", {
        user,
        accountKit: accountKit.client
          ? {
              address: accountKit.client.account?.address,
              chainId: accountKit.client.chain?.id,
            }
          : null,
      });

      if (!user) {
        console.log("No user found");
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
          console.log("Found EOA user:", {
            address: user.address,
            type: user.type,
          });
          await verifyMembership(user.address, "eoa");
          return;
        }

        // For Account Kit users, wait for client and check the SCA address
        if (user.type !== "eoa") {
          if (!accountKit.client?.account?.address) {
            console.log("Account Kit is still loading...");
            return;
          }

          console.log("Found Account Kit SCA:", {
            address: accountKit.client.account.address,
            chainId: accountKit.client.chain?.id,
          });
          await verifyMembership(accountKit.client.account.address, "sca");
          return;
        }

        console.log("No valid address found for verification");
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
        console.error("Error in checkMembership:", error);
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
