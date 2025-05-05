"use client";

import { useEffect, useState } from "react";
import { useSmartAccountClient, useUser } from "@account-kit/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEther, createPublicClient, http } from "viem";
import { testTokenContract } from "@/lib/contracts/TestToken";
import { base, baseSepolia, optimism } from "@account-kit/infra";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { client } = useSmartAccountClient({});
  const user = useUser();
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [ttBalance, setTtBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getBalances() {
      setIsLoading(true);
      try {
        const address = client?.account?.address || user?.address;
        if (!address) {
          setEthBalance(null);
          setTtBalance(null);
          return;
        }

        // Create a public client for the current chain
        const publicClient = createPublicClient({
          chain: baseSepolia, // You can make this dynamic based on the current chain
          transport: http(),
        });

        // Get ETH balance
        const ethBalance = await publicClient.getBalance({
          address: address as `0x${string}`,
        });
        setEthBalance(ethBalance);

        // Get TT balance
        const ttBalance = (await publicClient.readContract({
          address: testTokenContract.address,
          abi: testTokenContract.abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        })) as bigint;
        setTtBalance(ttBalance);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setEthBalance(null);
        setTtBalance(null);
      } finally {
        setIsLoading(false);
      }
    }
    getBalances();
  }, [client, user]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">ETH</span>
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">TT</span>
            <Skeleton className="h-5 w-16" />
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
        <div className="flex items-center justify-between">
          <span className="text-sm">ETH</span>
          <span className="text-sm font-medium">
            {ethBalance
              ? formatBalance(formatEther(ethBalance), "ETH")
              : "0 ETH"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">TT</span>
          <span className="text-sm font-medium">
            {ttBalance ? formatBalance(formatEther(ttBalance), "TT") : "0 TT"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
