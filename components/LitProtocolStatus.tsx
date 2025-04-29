"use client";

/**
 * LitProtocolStatus Component
 *
 * This component manages the Lit Protocol initialization, authentication state,
 * and session management for the application.
 *
 * TECHNICAL OVERVIEW:
 * - Handles both EOA and SCA wallet types for authentication with Lit Protocol
 * - Implements retry logic with exponential backoff for initialization failures
 * - Monitors session signature expiration and triggers re-authentication
 * - Provides visual feedback to users about the current state of Lit integration
 *
 * IMPLEMENTATION NOTES:
 * - EOA (Externally Owned Account) mode uses standard ECDSA signatures required by Lit
 * - SCA (Smart Contract Account) mode uses PKPs (Programmable Key Pairs)
 * - Session signatures expire after a set time and need to be refreshed
 * - The debounce pattern is used to prevent excessive calls to the Lit network
 *
 * INTEGRATION POINTS:
 * - useModularAccount: Provides the smart account client
 * - usePKPMint: Handles PKP minting for SCA users
 * - useSessionSigs: Manages authentication with the Lit network
 *
 * @see useSessionSigs in lib/sdk/lit/sessionSigs.ts for implementation details
 * @see usePKPMint in lib/hooks/lit/usePKPMint.ts for PKP minting logic
 */

import { useCallback, useEffect, useState, useRef } from "react";
import useModularAccount from "@/lib/hooks/accountkit/useModularAccount";
import { usePKPMint } from "@/lib/hooks/lit/usePKPMint";
import { useUser } from "@account-kit/react";
import { useSessionSigs } from "@/lib/sdk/lit/sessionSigs";
import { toast } from "sonner";
import type { AuthSig } from "@lit-protocol/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface InitializationState {
  hasClient: boolean;
  isInitializing: boolean;
  hasSessionSigs: boolean;
  error: Error | null;
  lastAttempt: number | null;
  walletType: "eoa" | "sca" | null;
}

const DEBOUNCE_DELAY = 1000; // 1 second
const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;
const RETRY_BACKOFF = [2000, 5000, 10000]; // Retry delays in ms

export function LitProtocolStatus(): JSX.Element {
  const { smartAccountClient: client } = useModularAccount();
  const { mintPKP } = usePKPMint();
  const {
    getSessionSigs,
    initLitClient,
    isConnected,
    isConnecting,
    connectionError,
    isEOAMode,
    resetClient
  } = useSessionSigs();

  const user = useUser();
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  // Define a default pkpPublicKey to be used with getSessionSigs
  // This empty string is acceptable for anonymous sessions or when not using PKP directly
  const pkpPublicKey = "";

  const [initState, setInitState] = useState<InitializationState>({
    hasClient: false,
    isInitializing: false,
    hasSessionSigs: false,
    error: null,
    lastAttempt: null,
    walletType: null,
  });

  // Cleanup function for debounce timeout
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Monitor wallet type changes
  useEffect(() => {
    setInitState((prev) => ({
      ...prev,
      walletType: isEOAMode ? "eoa" : "sca",
    }));
  }, [isEOAMode]);

  // Monitor session sigs and client state
  useEffect(() => {
    setInitState((prev) => ({
      ...prev,
      hasClient: isConnected,
      hasSessionSigs: isConnected && prev.hasSessionSigs,
    }));
  }, [isConnected]);

  // Monitor connection errors
  useEffect(() => {
    if (connectionError) {
      setInitState((prev) => ({
        ...prev,
        error: connectionError,
      }));
    }
  }, [connectionError]);

  // Debounced check for session signatures
  const debouncedCheckSessionSigs = useCallback(async (): Promise<boolean> => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    return new Promise((resolve) => {
      checkTimeoutRef.current = setTimeout(async () => {
        try {
          const sigs = await getSessionSigs(pkpPublicKey);
          if (sigs) {
            setInitState((prev) => ({ ...prev, hasSessionSigs: true }));
            resolve(true);
          } else {
            setInitState((prev) => ({ ...prev, hasSessionSigs: false }));
            resolve(false);
          }
        } catch (error) {
          console.error("Failed to check session signatures:", error);
          setInitState((prev) => ({
            ...prev,
            hasSessionSigs: false,
            error: error instanceof Error ? error : new Error("Failed to verify session")
          }));
          resolve(false);
        }
      }, DEBOUNCE_DELAY);
    });
  }, [getSessionSigs, pkpPublicKey]);

  // Run initialization with retry capability
  const runInitialization = useCallback(async () => {
    // Prevent concurrent initialization
    if (initState.isInitializing) {
      return;
    }

    setInitState((prev) => ({
      ...prev,
      isInitializing: true,
      error: null,
      walletType: isEOAMode ? "eoa" : "sca",
    }));

    try {
      if (!client) {
        throw new Error("Smart Account client not initialized");
      }

      // Initialize Lit client if not connected
      if (!isConnected) {
        console.log("Initializing Lit client...");
        await initLitClient();

        // If still not connected after attempt, throw
        if (!isConnected) {
          throw new Error("Failed to connect to Lit Network");
        }
      }

      // Check session signatures with debouncing
      const hasValidSigs = await debouncedCheckSessionSigs();
      if (!hasValidSigs) {
        throw new Error("Session signatures not ready - please try again");
      }

      // Only mint PKP for SCA users
      if (!isEOAMode) {
        console.log("SCA detected, proceeding with PKP minting...");
        const result = await mintPKP();

        if (!result.success) {
          throw new Error(result.error || "PKP minting failed");
        }

        console.log("PKP minting successful:", {
          result,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log("EOA detected, skipping PKP minting...");
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      setInitState((prev) => ({
        ...prev,
        hasClient: true,
        isInitializing: false,
        hasSessionSigs: true,
        error: null,
        lastAttempt: Date.now(),
      }));

      toast.success("Lit Protocol initialized successfully");
    } catch (error) {
      console.error("Lit Protocol initialization failed:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        retryCount: retryCountRef.current,
        timestamp: new Date().toISOString(),
      });

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Increment retry count and schedule retry if under max attempts
      retryCountRef.current++;
      if (retryCountRef.current < MAX_RETRIES) {
        const retryDelay = RETRY_BACKOFF[retryCountRef.current - 1] || RETRY_BACKOFF[0];
        console.log(`Scheduling retry ${retryCountRef.current} in ${retryDelay}ms`);

        setTimeout(() => {
          setInitState((prev) => ({ ...prev, isInitializing: false }));
          runInitialization();
        }, retryDelay);

        setInitState((prev) => ({
          ...prev,
          error: new Error(`${errorMessage} - Retrying...`),
          lastAttempt: Date.now(),
        }));
      } else {
        // Max retries reached, reset client and show error
        await resetClient();

        setInitState((prev) => ({
          ...prev,
          isInitializing: false,
          error: new Error(`${errorMessage} - Max retries reached`),
          lastAttempt: Date.now(),
        }));

        toast.error(`Lit Protocol initialization failed: ${errorMessage}`);
      }
    }
  }, [
    client,
    isConnected,
    isEOAMode,
    initLitClient,
    debouncedCheckSessionSigs,
    mintPKP,
    initState.isInitializing,
    resetClient,
  ]);

  // Auto-initialize when dependencies are ready
  useEffect(() => {
    if (!initState.isInitializing && !initState.hasClient && client && user?.type) {
      runInitialization();
    }
  }, [client, user?.type, initState.isInitializing, initState.hasClient, runInitialization]);

  // Provides a way for users to manually trigger initialization
  const handleManualInit = () => {
    // Reset retry count to ensure we get a full set of retries
    retryCountRef.current = 0;
    runInitialization();
  };

  if (!user?.type) {
    return (
      <Alert variant="default">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Lit Protocol Status</AlertTitle>
        <AlertDescription>
          Connect your wallet to enable Lit Protocol features
        </AlertDescription>
      </Alert>
    );
  }

  if (initState.isInitializing) {
    return (
      <Alert variant="default">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Initializing Lit Protocol</AlertTitle>
        <AlertDescription>
          {isConnecting ? (
            "Connecting to Lit Network..."
          ) : (
            isEOAMode ?
              "Setting up EOA authentication..." :
              "Setting up smart account integration..."
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (initState.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Lit Protocol Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{initState.error.message}</p>
          <button
            onClick={handleManualInit}
            className="text-xs underline cursor-pointer mt-2"
          >
            Retry initialization
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (initState.hasClient && initState.hasSessionSigs) {
    return (
      <Alert variant="default" className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>Lit Protocol Active</AlertTitle>
        <AlertDescription>
          {isEOAMode
            ? "Using EOA authentication with Lit Protocol"
            : "Smart account connected to Lit Protocol"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Lit Protocol Status</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>Waiting for initialization...</p>
        <button
          onClick={handleManualInit}
          className="text-xs underline cursor-pointer mt-2"
        >
          Initialize Lit Protocol
        </button>
      </AlertDescription>
    </Alert>
  );
}
