"use client";

import { useState, useEffect } from "react";
import { baseSepolia } from "@account-kit/infra";
import { usePKPMint } from "@/lib/hooks/lit/usePKPMint";
import { useUnifiedSessionSigner } from "@/lib/hooks/lit/useUnifiedSessionSigner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import SessionSigManager from "@/components/lit/GetSessionSigsButton";
import { toast } from "sonner";
import { useSessionSigs } from "@/lib/sdk/lit/sessionSigs";
import type { SessionSigs } from "@lit-protocol/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Loader2 } from "lucide-react";

/**
 * LitSmartAccount Component
 * 
 * This component handles the Lit Protocol Smart Account integration, facilitating:
 * 1. PKP (Programmable Key Pair) minting
 * 2. Session signature authentication
 * 3. Account management
 * 
 * Flow:
 * - User mints a PKP
 * - PKP enables a wallet-less experience with Lit Protocol
 * - Session signatures allow authentication for subsequent actions
 * 
 * @requires usePKPMint - Hook for PKP minting operations
 * @requires useUnifiedSessionSigner - Hook for session signature management
 * @requires useSessionSigs - Hook for explicit session signature retrieval
 */
export function LitSmartAccount() {
  // 1. PKP Minting
  // The PKP represents the user's identity in the Lit Protocol ecosystem
  const { pkp, mintPKP, isReady: isMintReady, mintStatus } = usePKPMint();
  const [isMinting, setIsMinting] = useState(false);

  // 2. Session Signer
  // Session signatures allow for authenticated interactions with Lit Protocol
  // without requiring the user to sign every transaction
  const pkpPublicKey = pkp?.publicKey || "";
  const {
    sessionSigs,
    authenticate: authenticateSessionSigner,
    isAuthenticated,
    error: sessionSignerError,
  } = useUnifiedSessionSigner({ pkpPublicKey, chain: baseSepolia });

  // 3. Explicit session sigs fetch
  // This provides a manual way to obtain session signatures
  // Useful for debugging or custom integrations
  const { getSessionSigs, isEOAMode, initLitClient, isConnected } = useSessionSigs();
  const [manualSessionSigs, setManualSessionSigs] =
    useState<SessionSigs | null>(null);
  const [isGettingSessionSigs, setIsGettingSessionSigs] = useState(false);

  // Check for any initialization errors from the session signer
  useEffect(() => {
    if (sessionSignerError) {
      console.error("Session signer error:", sessionSignerError);
      toast.error("Failed to initialize session signer: " + sessionSignerError.message);
    }
  }, [sessionSignerError]);

  /**
   * Fetches session signatures directly for the current PKP
   * Note: This is an alternative to the automatic session signature management
   */
  async function handleGetSessionSigs() {
    if (!pkp) {
      toast.error("No PKP found. Please mint one first.");
      return;
    }

    setIsGettingSessionSigs(true);
    try {
      const sigs = await getSessionSigs(pkp.publicKey);
      if (!sigs) {
        throw new Error("Failed to get session signatures");
      }
      setManualSessionSigs(sigs);
      toast.success("Session signatures obtained successfully");
    } catch (error) {
      console.error("Failed to get session signatures:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to get session signatures"
      );
    } finally {
      setIsGettingSessionSigs(false);
    }
  }

  /**
   * Handles the PKP minting process
   * Note: This creates a new Programmable Key Pair associated with the user
   */
  async function handleMint() {
    setIsMinting(true);

    try {
      // Ensure Lit client is connected before minting
      if (!isConnected) {
        console.log("Lit client not connected, initializing...");
        try {
          await initLitClient();
        } catch (error) {
          console.error("Failed to initialize Lit client:", error);
          toast.error(
            "Failed to initialize Lit client: " +
            (error instanceof Error ? error.message : "Unknown error")
          );
          return;
        }
      }

      // Check if we're in EOA mode - warn but don't block
      if (isEOAMode) {
        toast.warning(
          "Using EOA wallet for Lit Protocol authentication. This is required for signing PKP minting operations."
        );
      }

      const result = await mintPKP();

      if (!result.success || !result.pkp) {
        throw new Error(result.error || "Failed to mint PKP");
      }

      toast.success("PKP minted successfully!");

      // Attempt to authenticate with the newly minted PKP
      try {
        await authenticateSessionSigner();
      } catch (authError) {
        // Non-blocking - just show a warning
        console.warn("Authentication after minting failed:", authError);
        toast.warning(
          "PKP minted, but automatic authentication failed. Try getting session signatures manually."
        );
      }
    } catch (error) {
      console.error("PKP Minting failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to mint PKP"
      );
    } finally {
      setIsMinting(false);
    }
  }

  /**
   * Legacy method to obtain session signatures
   * Used by the SessionSigManager component
   * 
   * @returns Formatted array of session signatures
   */
  async function getSessionSigsLegacy() {
    try {
      if (!pkp) {
        toast.error("No PKP found. Please mint one first.");
        return [];
      }

      const sigs = await getSessionSigs(pkp.publicKey);
      if (!sigs) {
        throw new Error("Failed to get session signatures");
      }

      // Transform the data to match SessionSig format expected by SessionSigManager
      return [{
        id: "pkp-session",
        timestamp: new Date().toISOString(),
        expiresAt: new Date(sigs.expiration).toISOString(),
        signature: sigs.authSig.sig || "unknown"
      }];
    } catch (error) {
      console.error("Failed to get session signatures:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to get session signatures"
      );
      return [];
    }
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
        {/* Display wallet type information */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Wallet Type</AlertTitle>
          <AlertDescription>
            {isEOAMode
              ? "Using EOA wallet for Lit Protocol authentication"
              : "Using Smart Contract Account (SCA) for Lit Protocol authentication"}
          </AlertDescription>
        </Alert>

        {/* Conditional rendering based on PKP existence */}
        {!pkp ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              No PKP found. Mint one to continue.
            </p>

            {mintStatus.isProcessing ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Minting PKP in progress...</p>
                <p className="text-xs text-muted-foreground">This may take up to a minute</p>
              </div>
            ) : (
              <Button
                onClick={handleMint}
                disabled={isMinting || !isMintReady}
                className="w-full"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting PKP...
                  </>
                ) : (
                  "Mint PKP"
                )}
              </Button>
            )}

            {/* Display mint readiness state */}
            {!isMintReady && (
              <Alert variant="destructive">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Not ready to mint</AlertTitle>
                <AlertDescription>
                  Please ensure you have a connected wallet and Smart Account is initialized
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <>
            {/* PKP Information Display */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">PKP Public Key</p>
              <p className="font-mono text-xs break-all">{pkp.publicKey}</p>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">PKP Token ID</p>
              <p className="font-mono text-xs break-all">{pkp.tokenId}</p>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">PKP ETH Address</p>
              <p className="font-mono text-xs break-all">{pkp.ethAddress}</p>
            </div>

            {/* Session Authentication Status */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Authentication Status</p>
                <div
                  className={`h-3 w-3 rounded-full ${isAuthenticated ? "bg-green-500" : "bg-red-500"
                    }`}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isAuthenticated
                  ? "Authenticated with Lit Protocol"
                  : "Not authenticated with Lit Protocol"}
              </p>

              {/* Display any authentication errors */}
              {sessionSignerError && (
                <div className="mt-2 text-red-500 text-sm">
                  {sessionSignerError.message}
                </div>
              )}
            </div>

            {/* Session Signature Management */}
            <div className="rounded-lg border p-4 space-y-4">
              <p className="text-sm font-medium">Session Signatures</p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleGetSessionSigs}
                  disabled={isGettingSessionSigs || !pkp}
                  variant="outline"
                  size="sm"
                >
                  {isGettingSessionSigs ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Signatures...
                    </>
                  ) : (
                    "Get Session Signatures"
                  )}
                </Button>
                <SessionSigManager onGetSessionSigs={getSessionSigsLegacy} />
              </div>

              {/* Display manually fetched session signatures */}
              {manualSessionSigs && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Session signatures obtained. Expires:{" "}
                    {new Date(
                      String(manualSessionSigs.expiration)
                    ).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
