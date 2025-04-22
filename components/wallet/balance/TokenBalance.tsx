"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useChain } from "@account-kit/react";
import { createPublicClient, http } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { config } from "@/config";

export function TokenBalance() {
  const { account } = useAccount({
    type: "ModularAccountV2",
    accountParams: {
      mode: "default",
    },
    ...config,
  });
  const { chain } = useChain();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      if (!account?.address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const publicClient = createPublicClient({
          chain,
          transport: http(),
        });

        const rawBalance = await publicClient.getBalance({
          address: account.address,
        });

        setBalance(formatEther(rawBalance));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [account?.address, chain]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Balance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <div className="text-2xl font-bold">
            {parseFloat(balance).toFixed(4)} {chain.nativeCurrency.symbol}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
