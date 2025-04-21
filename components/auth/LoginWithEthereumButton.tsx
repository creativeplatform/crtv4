"use client";

import { useState } from "react";
import { useSiweAuth } from "@/lib/hooks/useSiweAuth";
import { sendSiweToServer } from "@/lib/sdk/orbis/sendSiweToServer";
import type { AuthOrbisSession, AuthOrbisError } from "@/types/orbis";

/**
 * LoginWithEthereumButton
 * UI component for SIWE + OrbisDB authentication.
 * Handles wallet connection, SIWE signing, and server authentication.
 */
export function LoginWithEthereumButton() {
  const { loading, error, signInWithEthereum } = useSiweAuth();
  const [authResult, setAuthResult] = useState<AuthOrbisSession | null>(null);
  const [authError, setAuthError] = useState<AuthOrbisError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setAuthError(null);
    setSubmitting(true);
    // 1. Run SIWE flow
    const siwePayload = await signInWithEthereum();
    if (!siwePayload) {
      setSubmitting(false);
      setAuthError({
        code: "SIWE_FAILED",
        message: error || "SIWE signing failed.",
      });
      return;
    }
    // 2. Send to server for OrbisDB authentication
    const result = await sendSiweToServer(siwePayload);
    if ("orbis" in result) {
      setAuthResult(result);
    } else {
      setAuthError(result);
    }
    setSubmitting(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading || submitting}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {loading || submitting ? "Signing in..." : "Login"}
      </button>
      {authError && (
        <div className="mt-2 text-red-600 text-sm">{authError.message}</div>
      )}
      {authResult && (
        <div className="mt-2 text-green-600 text-sm">
          Signed in as {authResult.orbis.address}
        </div>
      )}
    </div>
  );
}
