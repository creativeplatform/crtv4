import * as React from "react";
import { toast } from "@/components/ui/use-toast";

interface TransactionToastConfig {
  hash: string;
  chainId: number;
  description?: string;
}

export function showTransactionToast({
  hash,
  chainId,
  description,
}: TransactionToastConfig) {
  const explorerUrl = getExplorerUrl(chainId, hash);

  // Show pending toast
  const { id } = toast({
    title: "Transaction Submitted",
    description:
      description || "Your transaction has been submitted to the network.",
    variant: "pending",
    action: explorerUrl ? (
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-yellow-500"
      >
        View on Explorer
      </a>
    ) : undefined,
  });

  // Update toast when transaction is confirmed
  return {
    success: () => {
      toast({
        id,
        title: "Transaction Confirmed",
        description: description || "Your transaction has been confirmed.",
        variant: "success",
        action: explorerUrl ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-green-500"
          >
            View on Explorer
          </a>
        ) : undefined,
      });
    },
    error: (error: Error) => {
      toast({
        id,
        title: "Transaction Failed",
        description: error.message || "Your transaction has failed.",
        variant: "destructive",
        action: explorerUrl ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-red-500"
          >
            View on Explorer
          </a>
        ) : undefined,
      });
    },
  };
}

function getExplorerUrl(chainId: number, hash: string): string | undefined {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    5: "https://goerli.etherscan.io",
    137: "https://polygonscan.com",
    80001: "https://mumbai.polygonscan.com",
    84531: "https://sepolia.basescan.org",
    // Add more chains as needed
  };

  const baseUrl = explorers[chainId];
  if (!baseUrl) return undefined;

  return `${baseUrl}/tx/${hash}`;
}
