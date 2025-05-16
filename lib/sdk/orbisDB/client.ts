"use client";

import { OrbisDB } from "@useorbis/db-sdk";
import {
  useUser,
  useAuthModal,
  useSmartAccountClient,
  useLogout,
} from "@account-kit/react";

// Validate required environment variables
const NEXT_PUBLIC_ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const CERAMIC_NODE_URL = process.env.NEXT_PUBLIC_CERAMIC_NODE_URL;
const ORBIS_NODE_URL = process.env.NEXT_PUBLIC_ORBIS_NODE_URL;
const ORBIS_ENVIRONMENT_ID = process.env.NEXT_PUBLIC_ORBIS_ENVIRONMENT_ID;

if (
  !NEXT_PUBLIC_ALCHEMY_API_KEY ||
  !CERAMIC_NODE_URL ||
  !ORBIS_NODE_URL ||
  !ORBIS_ENVIRONMENT_ID
) {
  throw new Error(
    "Missing required environment variables for OrbisDB initialization"
  );
}

// Initialize OrbisDB instance
export const db = new OrbisDB({
  ceramic: {
    gateway: CERAMIC_NODE_URL,
  },
  nodes: [
    {
      gateway: ORBIS_NODE_URL,
      env: ORBIS_ENVIRONMENT_ID,
    },
  ],
});

/**
 * Custom hook for managing authentication state and actions
 * Replaces OrbisDB authentication with Account Kit
 */
export function useAuth() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();
  const { client } = useSmartAccountClient({
    type: "ModularAccountV2",
    accountParams: {
      mode: "default",
    },
  });

  return {
    user,
    client,
    isConnected: !!user,
    connect: openAuthModal,
    disconnect: logout,
    isAuthenticated: !!user && !!client,
    getAuthStatus: () => ({
      authenticated: !!user && !!client,
      details: !user
        ? "No user connected"
        : !client
        ? "Smart account not initialized"
        : "Authentication verified",
    }),
  };
}

// Export types for TypeScript support
export type AuthHookResult = ReturnType<typeof useAuth>;
