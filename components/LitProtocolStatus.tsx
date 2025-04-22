"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import useModularAccount from "@/lib/hooks/useModularAccount";
import { usePKPMint } from "@/lib/sdk/lit/usePKPMint";
import { useUser } from "@account-kit/react";
import { useSessionSigs } from "@/lib/sdk/lit/sessionSigs";
import { toast } from "sonner";
import type { AuthSig } from "@lit-protocol/types";

interface InitializationState {
  hasClient: boolean;
  isInitializing: boolean;
  hasSessionSigs: boolean;
  error: string | null;
  lastAttempt: number | null;
  sessionExpiration?: string;
}

const DEBOUNCE_DELAY = 1000; // 1 second
const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

function isValidDate(date: string | undefined): date is string {
  if (!date) return false;
  const timestamp = Date.parse(date);
  return !isNaN(timestamp);
}

export function LitProtocolStatus(): JSX.Element {
  const { smartAccountClient: client } = useModularAccount();
  const { mintPKP } = usePKPMint();
  const { getSessionSigs, initLitClient, isConnected } = useSessionSigs();
  const user = useUser();
  const checkTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  const [initState, setInitState] = useState<InitializationState>({
    hasClient: false,
    isInitializing: false,
    hasSessionSigs: false,
    error: null,
    lastAttempt: null,
  });

  // Cleanup function for debounce timeout
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const checkSessionSigs = useCallback(async () => {
    try {
      console.log("Checking session signatures...");
      const sigs = await getSessionSigs();

      if (!sigs) {
        console.log("Session signatures not available");
        return false;
      }

      const sigsArray = Object.values(sigs);
      if (!sigsArray.length) {
        console.log("No session signatures found in array");
        return false;
      }

      const firstSig = sigsArray[0] as AuthSig & { expiration?: string };
      if (!firstSig?.signedMessage || !firstSig?.sig) {
        console.log("Invalid session signature format");
        return false;
      }

      // Validate signature format
      if (!firstSig.sig.startsWith("0x")) {
        console.log("Invalid signature format - missing 0x prefix");
        return false;
      }

      // Check expiration if available
      if (isValidDate(firstSig.expiration)) {
        const expiryTime = new Date(firstSig.expiration).getTime();
        const currentTime = Date.now();
        if (currentTime + SESSION_EXPIRY_BUFFER >= expiryTime) {
          console.log("Session signature expired or expiring soon");
          toast.warning("Session expiring soon. Please re-authenticate.");
          return false;
        }

        // Update state with session expiration
        setInitState((prev) => ({
          ...prev,
          sessionExpiration: firstSig.expiration,
        }));
      }

      console.log("Session signatures verified successfully:", {
        sigCount: sigsArray.length,
        firstSigFormat: firstSig.sig.slice(0, 10) + "...",
      });
      return true;
    } catch (error) {
      console.error("Error checking session signatures:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }, [getSessionSigs]);

  const debouncedCheckSessionSigs = useCallback(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    return new Promise<boolean>((resolve) => {
      checkTimeoutRef.current = setTimeout(async () => {
        const result = await checkSessionSigs();
        resolve(result);
      }, DEBOUNCE_DELAY);
    });
  }, [checkSessionSigs]);

  const handleInitializeLit = useCallback(async () => {
    console.log("Starting Lit Protocol initialization...", {
      currentState: initState,
      hasClient: !!client,
      userType: user?.type,
      retryCount: retryCountRef.current,
      timestamp: new Date().toISOString(),
    });

    if (initState.isInitializing) {
      console.log("Initialization already in progress");
      return;
    }

    if (retryCountRef.current >= MAX_RETRIES) {
      const error = "Max retry attempts reached. Please try again later.";
      console.error(error);
      setInitState((prev) => ({
        ...prev,
        isInitializing: false,
        error,
      }));
      return;
    }

    setInitState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      if (!client) {
        throw new Error("Smart Account client not initialized");
      }

      if (user?.type !== "sca") {
        throw new Error("Lit Protocol requires a Smart Contract Account");
      }

      // Initialize Lit client if not connected
      if (!isConnected) {
        console.log("Initializing Lit client...");
        await initLitClient();
      }

      // Check session signatures with debouncing
      const hasValidSigs = await debouncedCheckSessionSigs();
      if (!hasValidSigs) {
        throw new Error("Session signatures not ready - please try again");
      }

      console.log("Prerequisites checked, proceeding with PKP minting...");
      const result = await mintPKP();
      console.log("PKP minting successful:", {
        result,
        timestamp: new Date().toISOString(),
      });

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
        console.log(`Retrying initialization in ${RETRY_DELAY}ms...`);
        setTimeout(() => handleInitializeLit(), RETRY_DELAY);
      }

      setInitState((prev) => ({
        ...prev,
        hasClient: !!client,
        isInitializing: retryCountRef.current < MAX_RETRIES,
        hasSessionSigs: false,
        error: errorMessage,
        lastAttempt: Date.now(),
      }));

      if (retryCountRef.current >= MAX_RETRIES) {
        toast.error(
          `Failed to initialize Lit Protocol after ${MAX_RETRIES} attempts. Please try again later.`
        );
      } else {
        toast.error(`Failed to initialize Lit Protocol: ${errorMessage}`);
      }
    }
  }, [
    client,
    user?.type,
    mintPKP,
    initState.isInitializing,
    debouncedCheckSessionSigs,
    isConnected,
    initLitClient,
  ]);

  // Check for session expiry periodically
  useEffect(() => {
    if (
      !initState.sessionExpiration ||
      !isValidDate(initState.sessionExpiration)
    )
      return;

    const checkInterval = setInterval(() => {
      const expiryTime = new Date(
        initState.sessionExpiration as string
      ).getTime();
      const currentTime = Date.now();

      if (currentTime + SESSION_EXPIRY_BUFFER >= expiryTime) {
        console.log("Session expired, triggering re-authentication");
        toast.warning("Session expired. Please re-authenticate.");
        setInitState((prev) => ({
          ...prev,
          hasSessionSigs: false,
          error: "Session expired",
        }));
      }
    }, SESSION_EXPIRY_BUFFER);

    return () => clearInterval(checkInterval);
  }, [initState.sessionExpiration]);

  useEffect(() => {
    console.log("LitProtocolStatus effect triggered:", {
      hasClient: !!client,
      userType: user?.type,
      currentState: initState,
      timestamp: new Date().toISOString(),
    });

    if (
      !initState.isInitializing &&
      !initState.error &&
      !initState.lastAttempt &&
      client &&
      user?.type === "sca"
    ) {
      handleInitializeLit();
    }
  }, [client, user?.type, handleInitializeLit, initState]);

  if (initState.error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 bg-red-50 rounded-md">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span>Failed to initialize Lit Protocol: {initState.error}</span>
        <button
          onClick={handleInitializeLit}
          className="px-2 py-1 ml-2 text-xs text-red-600 border border-red-300 rounded hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (initState.isInitializing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-blue-500 bg-blue-50 rounded-md">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span>Initializing Lit Protocol...</span>
      </div>
    );
  }

  if (!initState.hasClient || !initState.hasSessionSigs) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-500 bg-yellow-50 rounded-md">
        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
        <span>Waiting for initialization...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm text-green-500 bg-green-50 rounded-md">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <span>Lit Protocol initialized successfully</span>
    </div>
  );
}
