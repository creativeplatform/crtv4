"use client";

import { useEffect, useState } from "react";
import { baseSepolia } from "@account-kit/infra";
import { useLitSmartAccount } from "@/lib/hooks/lit/useLitSmartAccount";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PKPMintInfo, usePKPMint } from "@/lib/hooks/lit/usePKPMint";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LitSmartAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [pkp, setPkp] = useState<PKPMintInfo | null>(null);
  const { mintPKP, isReady: isMintReady } = usePKPMint();
  const { client, address, error, isLoadingClient, isAuthenticated } =
    useLitSmartAccount({
      pkpPublicKey: pkp?.publicKey || "",
      chain: baseSepolia,
    });

  // Handle PKP minting
  const handleMintPKP = async () => {
    try {
      setIsLoading(true);
      const mintResult = await mintPKP();

      if (!mintResult.success || !mintResult.pkp) {
        throw new Error(mintResult.error || "Failed to mint PKP");
      }

      setPkp(mintResult.pkp);
      toast.success("PKP minted successfully!");
    } catch (error) {
      toast.error(
        `Failed to mint PKP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize account when PKP is available
  useEffect(() => {
    if (pkp && !client && !error) {
      toast.error(`Failed to initialize account.`);
    }
  }, [pkp, client, error]);

  if (!isMintReady || isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Lit Smart Account</CardTitle>
        <CardDescription>
          Create and manage your Lit Protocol Smart Account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!pkp ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              No PKP found. Mint one to continue.
            </p>
            <Button onClick={handleMintPKP} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Minting..." : "Mint PKP"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">PKP Public Key</p>
              <p className="font-mono text-xs break-all">{pkp.publicKey}</p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">PKP ETH Address</p>
              <p className="font-mono text-xs break-all">{pkp.ethAddress}</p>
            </div>

            {address && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Smart Account Address
                </p>
                <p className="font-mono text-xs break-all">{address}</p>
              </div>
            )}

            <div className="mt-4">
              {isAuthenticated ? (
                <p className="text-sm text-green-600 flex items-center">
                  <span className="mr-2">✓</span>
                  Authenticated
                </p>
              ) : (
                <p className="text-sm text-yellow-600">Not authenticated</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive">{error.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
