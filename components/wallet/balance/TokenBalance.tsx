"use client";

import { useEffect, useState, useCallback } from "react";
import { useChain } from "@account-kit/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther } from "viem";
import { publicClient } from "@/lib/viem";
import { useWalletStatus } from "@/lib/hooks/accountkit/useWalletStatus";

// Utility function to format ETH balance with proper precision
function formatBalance(balance: string): string {
  // Convert to number for comparison
  const num = parseFloat(balance);
  if (num === 0) return "0 ETH";

  // If number is very small (less than 0.00001), use scientific notation
  if (num < 0.00001) return num.toExponential(5) + " ETH";

  // For regular numbers, preserve significant digits up to 5 decimal places
  // First, ensure we're working with a string that has all significant digits
  const significantDigits = 5;
  const [integerPart, decimalPart = ""] = balance.split(".");

  // If decimal part is shorter than significant digits, use it as is
  if (decimalPart.length <= significantDigits) {
    // Remove trailing zeros
    const cleanDecimal = decimalPart.replace(/0+$/, "");
    return cleanDecimal
      ? `${integerPart}.${cleanDecimal} ETH`
      : `${integerPart} ETH`;
  }

  // Otherwise, truncate to significant digits and remove trailing zeros
  const truncatedDecimal = decimalPart
    .slice(0, significantDigits)
    .replace(/0+$/, "");
  return truncatedDecimal
    ? `${integerPart}.${truncatedDecimal} ETH`
    : `${integerPart} ETH`;
}

export function TokenBalance() {
  const { isConnected, walletAddress, smartAccountAddress } = useWalletStatus();
  const { chain } = useChain();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const fetchBalance = useCallback(async () => {
    if (!isConnected || (!walletAddress && !smartAccountAddress) || !chain) {
      console.log("Missing required data:", {
        walletAddress,
        smartAccountAddress,
        chain,
      });
      setIsLoading(false);
      return;
    }

    try {
      // Don't show loading state if we're just updating
      const isInitialLoad = !lastUpdateTime;
      if (isInitialLoad) {
        setIsLoading(true);
      }
      setError(null);

      // First try to get balance using Alchemy API
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      const baseURL = `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;

      // Try to get balance for both addresses if they exist
      const addresses = [walletAddress, smartAccountAddress].filter(
        Boolean
      ) as string[];
      let totalBalance = BigInt(0);

      for (const address of addresses) {
        try {
          const response = await fetch(baseURL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_getBalance",
              params: [address, "latest"],
            }),
          });

          if (!response.ok) {
            // Fallback to viem publicClient if Alchemy fails
            const hexBalance = await publicClient.getBalance({
              address: address as `0x${string}`,
            });
            totalBalance += hexBalance;
          } else {
            const data = await response.json();
            totalBalance += BigInt(data.result);
          }
        } catch (err) {
          console.error(`Error fetching balance for ${address}:`, err);
          // Continue to next address if one fails
        }
      }

      const formattedBalance = formatEther(totalBalance);
      setBalance(formattedBalance);
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error("Error fetching balances:", error);
      setError("Failed to fetch balance");
      // Don't reset balance to 0 on error - keep the last known value
      // Only set to 0 if we don't have a previous value
      if (!balance) setBalance("0");
    } finally {
      setIsLoading(false);
    }
  }, [
    walletAddress,
    smartAccountAddress,
    chain,
    isConnected,
    lastUpdateTime,
    balance,
  ]);

  useEffect(() => {
    fetchBalance();

    // Only set up polling if we're connected
    if (isConnected) {
      const interval = setInterval(fetchBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, isConnected]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Connect wallet to view balance
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !balance ? (
          <Skeleton className="h-6 w-24" />
        ) : error && !balance ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <div className="text-2xl font-bold">{formatBalance(balance)}</div>
        )}
      </CardContent>
    </Card>
  );
}
