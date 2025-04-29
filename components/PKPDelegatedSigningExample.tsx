"use client";

/**
 * PKPDelegatedSigningExample Component
 * 
 * This component demonstrates how to use Lit Protocol's PKP delegated signing capability.
 * 
 * Purpose:
 * - Provides a UI for users to sign messages using their PKP (Programmable Key Pair)
 * - Demonstrates the delegated signing flow with capacity token usage
 * - Shows different behavior based on wallet type (EOA vs Smart Contract Account)
 * 
 * Dependencies:
 * - usePKPDelegatedSigning: Custom hook that handles the delegated signing process
 * - useSessionSigs: Hook that provides information about the current session mode
 * - UI components from the shadcn/ui library
 * 
 * Props:
 * - pkpInfo: Object containing the PKP token ID, public key, and Ethereum address
 * - capacityTokenId: The ID of the capacity token used for rate limiting
 * 
 * Usage Example:
 * ```tsx
 * <PKPDelegatedSigningExample 
 *   pkpInfo={{
 *     tokenId: "123",
 *     publicKey: "0x...",
 *     ethAddress: "0x..."
 *   }}
 *   capacityTokenId="456"
 * />
 * ```
 * 
 * Note: This component requires a valid Lit Protocol session to function correctly.
 * The user must be authenticated with Lit Protocol before using this component.
 */

import { useState } from "react";
import { usePKPDelegatedSigning } from "@/lib/hooks/lit/usePKPDelegatedSigning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionSigs } from "@/lib/sdk/lit/sessionSigs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface PKPDelegatedSigningExampleProps {
  pkpInfo: {
    tokenId: string;
    publicKey: string;
    ethAddress: string;
  };
  capacityTokenId: string;
}

export function PKPDelegatedSigningExample({
  pkpInfo,
  capacityTokenId,
}: PKPDelegatedSigningExampleProps) {
  const { signWithDelegation } = usePKPDelegatedSigning();
  const { isEOAMode } = useSessionSigs();
  const [message, setMessage] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [isLoading, setIsLoading] = useState(false);

  const handleSign = async () => {
    if (!message) {
      toast.error("Please enter a message to sign");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signWithDelegation({
        message,
        pkpInfo,
        capacityTokenId,
        maxUses: parseInt(maxUses, 10),
      });

      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to sign message");
      }

      toast.success("Message signed successfully!");
      console.log("Signature:", result.signatures);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">PKP Delegated Signing Example</h2>

        {isEOAMode && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Using EOA Mode</AlertTitle>
            <AlertDescription>
              You are currently using an EOA wallet for Lit Protocol
              authentication. This allows for standard ECDSA signatures required
              by Lit Protocol.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            PKP Token ID: {pkpInfo.tokenId}
          </p>
          <p className="text-sm text-muted-foreground">
            Capacity Token ID: {capacityTokenId}
          </p>
          <p className="text-sm text-muted-foreground">
            Wallet Type: {isEOAMode ? "EOA" : "Smart Contract Account"}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium">
            Message to Sign
          </label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to sign..."
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="maxUses" className="text-sm font-medium">
            Max Uses
          </label>
          <Select
            value={maxUses}
            onValueChange={setMaxUses}
            disabled={isLoading}
          >
            <SelectTrigger id="maxUses">
              <SelectValue placeholder="Select max uses" />
            </SelectTrigger>
            <SelectContent>
              {[1, 5, 10, 25, 50, 100].map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  {value} {value === 1 ? "use" : "uses"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Number of times this delegation can be used
          </p>
        </div>

        <Button
          onClick={handleSign}
          disabled={!message || isLoading}
          className="w-full"
        >
          {isLoading ? "Signing..." : "Sign Message"}
        </Button>
      </div>
    </Card>
  );
}
