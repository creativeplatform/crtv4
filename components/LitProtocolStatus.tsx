"use client";

import { useEffect, useState } from "react";
import { useLitSmartAccount } from "@/lib/sdk/lit/useLitSmartAccount";
import { baseSepolia } from "@account-kit/infra";
import { PKPMintInfo, usePKPMint } from "@/lib/sdk/lit/usePKPMint";
import { toast } from "sonner";

export function LitProtocolStatus() {
  const { mintPKP, isReady: isMintReady } = usePKPMint();
  const [pkp, setPkp] = useState<PKPMintInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, isLoadingClient } = useLitSmartAccount({
    pkpPublicKey: pkp?.publicKey || "",
    chain: baseSepolia,
  });

  useEffect(() => {
    if (!pkp && isMintReady) {
      const initializePKP = async () => {
        try {
          const mintResult = await mintPKP();
          setPkp(mintResult.pkp);
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Failed to mint PKP");
          console.error("Failed to mint PKP:", error);
          setError(error);
          toast.error(error.message);
        }
      };
      initializePKP();
    }
  }, [isMintReady, mintPKP, pkp]);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm text-red-500">Lit initialization failed</span>
      </div>
    );
  }

  if (isLoadingClient || !isMintReady) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-sm">Initializing Lit...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div
        className={`w-2 h-2 rounded-full ${
          isAuthenticated ? "bg-green-500" : "bg-yellow-500"
        }`}
      />
      <span className="text-sm">
        {isAuthenticated ? "Connected to Lit" : "Not connected to Lit"}
      </span>
    </div>
  );
}
