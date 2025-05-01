"use client";

import { useEffect, useState, useCallback } from "react";
import { useChain } from "@account-kit/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEther, formatUnits } from "viem";
import { publicClient } from "@/lib/viem";
import { useWalletStatus } from "@/lib/hooks/accountkit/useWalletStatus";
import { testTokenContract } from "@/lib/contracts/TestToken";

interface TokenBalanceData {
  symbol: string;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

// Utility function to format balance with proper precision
function formatBalance(balance: string, symbol: string): string {
  // Convert to number for comparison
  const num = parseFloat(balance);
  if (num === 0) return `0 ${symbol}`;

  // If number is very small (less than 0.00001), use scientific notation
  if (num < 0.00001) return `${num.toExponential(5)} ${symbol}`;

  // For regular numbers, preserve significant digits up to 5 decimal places
  const [integerPart, decimalPart = ""] = balance.split(".");

  // If decimal part is shorter than significant digits, use it as is
  if (decimalPart.length <= 5) {
    const cleanDecimal = decimalPart.replace(/0+$/, "");
    return cleanDecimal
      ? `${integerPart}.${cleanDecimal} ${symbol}`
      : `${integerPart} ${symbol}`;
  }

  // Otherwise, truncate to significant digits and remove trailing zeros
  const truncatedDecimal = decimalPart.slice(0, 5).replace(/0+$/, "");
  return truncatedDecimal
    ? `${integerPart}.${truncatedDecimal} ${symbol}`
    : `${integerPart} ${symbol}`;
}

export function TokenBalance() {
  const { isConnected, walletAddress, smartAccountAddress } = useWalletStatus();
  const { chain } = useChain();
  const [balances, setBalances] = useState<Record<string, TokenBalanceData>>({
    ETH: { symbol: "ETH", balance: "0", isLoading: true, error: null },
    [testTokenContract.symbol]: {
      symbol: testTokenContract.symbol,
      balance: "0",
      isLoading: true,
      error: null,
    },
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const fetchBalances = useCallback(async () => {
    if (!isConnected || (!walletAddress && !smartAccountAddress) || !chain) {
      console.log("Missing required data:", {
        walletAddress,
        smartAccountAddress,
        chain,
      });
      setBalances((prev) => ({
        ...prev,
        ETH: { ...prev.ETH, isLoading: false },
        [testTokenContract.symbol]: {
          ...prev[testTokenContract.symbol],
          isLoading: false,
        },
      }));
      return;
    }

    try {
      // Don't show loading state if we're just updating
      const isInitialLoad = !lastUpdateTime;
      if (isInitialLoad) {
        setBalances((prev) => ({
          ...prev,
          ETH: { ...prev.ETH, isLoading: true },
          [testTokenContract.symbol]: {
            ...prev[testTokenContract.symbol],
            isLoading: true,
          },
        }));
      }

      // Get addresses to check
      const addresses = [walletAddress, smartAccountAddress].filter(
        Boolean
      ) as `0x${string}`[];

      // Fetch ETH balances
      let totalEthBalance = BigInt(0);
      for (const address of addresses) {
        try {
          const balance = await publicClient.getBalance({ address });
          totalEthBalance += balance;
        } catch (err) {
          console.error(`Error fetching ETH balance for ${address}:`, err);
        }
      }

      // Fetch TT token balances
      let totalTokenBalance = BigInt(0);
      for (const address of addresses) {
        try {
          const balance = await publicClient.readContract({
            ...testTokenContract,
            functionName: "balanceOf",
            args: [address],
          });
          totalTokenBalance += balance as bigint;
        } catch (err) {
          console.error(
            `Error fetching ${testTokenContract.symbol} balance for ${address}:`,
            err
          );
        }
      }

      setBalances((prev) => ({
        ETH: {
          ...prev.ETH,
          balance: formatEther(totalEthBalance),
          isLoading: false,
          error: null,
        },
        [testTokenContract.symbol]: {
          ...prev[testTokenContract.symbol],
          balance: formatUnits(totalTokenBalance, testTokenContract.decimals),
          isLoading: false,
          error: null,
        },
      }));
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error("Error fetching balances:", error);
      setBalances((prev) => ({
        ETH: {
          ...prev.ETH,
          error: "Failed to fetch balance",
          isLoading: false,
        },
        [testTokenContract.symbol]: {
          ...prev[testTokenContract.symbol],
          error: "Failed to fetch balance",
          isLoading: false,
        },
      }));
    }
  }, [walletAddress, smartAccountAddress, chain, isConnected, lastUpdateTime]);

  useEffect(() => {
    fetchBalances();

    // Only set up polling if we're connected
    if (isConnected) {
      const interval = setInterval(fetchBalances, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, isConnected]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Connect wallet to view balances
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Balances</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(balances).map(([symbol, data]) => (
          <div key={symbol} className="flex items-center justify-between">
            <span className="text-sm font-medium">{symbol}</span>
            <div>
              {data.isLoading && !data.balance ? (
                <Skeleton className="h-6 w-24" />
              ) : data.error && !data.balance ? (
                <div className="text-sm text-red-500">{data.error}</div>
              ) : (
                <div className="text-sm font-bold">
                  {formatBalance(data.balance, data.symbol)}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
