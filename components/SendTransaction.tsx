"use client";

import React, { useState, useEffect } from "react";
import { useSendUserOperation } from "@account-kit/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useModularAccount from "@/lib/hooks/useModularAccount";

/**
 * Component for sending transactions using Account Kit smart account
 */
export default function SendTransaction() {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [data, setData] = useState<string>("0x");
  const [address, setAddress] = useState<string | null>(null);

  // Get the smart account client using our custom hook
  const {
    smartAccountClient: client,
    loading: isLoadingClient,
    getAddress,
  } = useModularAccount();

  // Get the account address
  useEffect(() => {
    if (client) {
      getAddress().then((addr) => setAddress(addr));
    }
  }, [client, getAddress]);

  // Set up the hook for sending user operations
  const { sendUserOperation, isSendingUserOperation, error } =
    useSendUserOperation({
      client,
      waitForTxn: true, // Wait for the transaction to be mined
      onSuccess: ({ hash, request }) => {
        toast.success("Transaction sent successfully!");
        console.log("Transaction hash:", hash);
        console.log("Request:", request);
        setRecipient("");
        setAmount("");
        setData("0x");
      },
      onError: (error) => {
        toast.error(`Transaction failed: ${error.message}`);
        console.error("Transaction error:", error);
      },
    });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient) {
      toast.error("Please enter a recipient address");
      return;
    }

    if (!amount && !data) {
      toast.error("Please enter an amount or transaction data");
      return;
    }

    try {
      // Convert amount to BigInt (in wei)
      const valueInWei = amount ? BigInt(Math.floor(parseFloat(amount) * 10 ** 18)) : BigInt(0);

      // Send the transaction
      sendUserOperation({
        uo: {
          target: recipient as `0x${string}`,
          data: data.startsWith("0x") ? (data as `0x${string}`) : ("0x" as `0x${string}`),
          value: valueInWei,
        },
      });
    } catch (error) {
      console.error("Error preparing transaction:", error);
      toast.error("Error preparing transaction");
    }
  };

  if (isLoadingClient) {
    return <div className="p-4 text-center">Loading smart account...</div>;
  }

  if (!client || !address) {
    return (
      <div className="p-4 text-center">
        Please connect your wallet to use this feature
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Send Transaction</h2>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm">
          Smart Account: <span className="font-mono">{address}</span>
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            step="0.000001"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">
            Data (Optional)
            <span className="text-xs text-gray-500 ml-2">
              Leave as 0x for simple transfers
            </span>
          </Label>
          <Input
            id="data"
            placeholder="0x"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSendingUserOperation}
        >
          {isSendingUserOperation ? "Sending..." : "Send Transaction"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm font-medium">Error:</p>
          <p className="text-xs">{error.message}</p>
        </div>
      )}
    </div>
  );
}
