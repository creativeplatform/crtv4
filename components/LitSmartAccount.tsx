"use client";

import { useEffect, useState } from "react";
import { baseSepolia } from "@account-kit/infra";
import { useLitSmartAccount } from "@/lib/hooks/lit/useLitSmartAccount";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PKPMintInfo, usePKPMint } from "@/lib/hooks/lit/usePKPMint";

export function LitSmartAccount() {
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
      const mintResult = await mintPKP();
      setPkp(mintResult.pkp);
      toast.success("PKP minted successfully!");
    } catch (error) {
      toast.error(
        `Failed to mint PKP: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Initialize account when PKP is available
  useEffect(() => {
    if (pkp && !client && !error) {
      toast.error(`Failed to initialize account.`);
    }
  }, [pkp, client, error]);

  if (!isMintReady || isLoadingClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold">Lit Smart Account</h2>

      {!pkp ? (
        <div>
          <p className="mb-4">No PKP found. Mint one to continue.</p>
          <Button onClick={handleMintPKP}>Mint PKP</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p>
            PKP Public Key:{" "}
            <span className="font-mono text-sm break-all">{pkp.publicKey}</span>
          </p>
          <p>
            PKP ETH Address:{" "}
            <span className="font-mono text-sm break-all">
              {pkp.ethAddress}
            </span>
          </p>
          {address && (
            <p>
              Smart Account Address:{" "}
              <span className="font-mono text-sm break-all">{address}</span>
            </p>
          )}
          {isAuthenticated ? (
            <p className="text-green-600">✓ Authenticated</p>
          ) : (
            <p className="text-yellow-600">Not authenticated</p>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-red-600">{error.message}</p>
        </div>
      )}
    </div>
  );
}
