"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import {
  useUser,
  useAuthenticate,
  useSmartAccountClient,
} from "@account-kit/react";
import { catchError } from "@useorbis/db-sdk/util";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";
import { OrbisConnectResult } from "@useorbis/db-sdk";
import { db } from "@/lib/sdk/orbisDB/client";
import { AssetMetadata } from "@/lib/sdk/orbisDB/models/AssetMetadata";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Generate a unique ID for events
function generateEventUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

interface SerializableAuthResult {
  did: string;
  details: Record<string, any>;
}

interface OrbisContextProps {
  authResult: SerializableAuthResult | null;
  setAuthResult: React.Dispatch<
    React.SetStateAction<SerializableAuthResult | null>
  >;
  insert: (modelId: string, value: any) => Promise<void>;
  replace: (docId: string, newDoc: any) => Promise<void>;
  update: (docId: string, updates: any) => Promise<void>;
  getAssetMetadata: (assetId: string) => Promise<AssetMetadata | null>;
  orbisLogin: () => Promise<OrbisConnectResult | null>;
  isConnected: (address?: string) => Promise<boolean>;
  getCurrentUser: () => Promise<any>;
  insertMetokenMetadata: (metadata: {
    address: string;
    token_name: string;
    token_symbol: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  user: any;
}

const defaultContext: OrbisContextProps = {
  authResult: null,
  setAuthResult: () => {},
  insert: async () => {},
  replace: async () => {},
  update: async () => {},
  getAssetMetadata: async () => null,
  orbisLogin: async () => null,
  isConnected: async () => false,
  getCurrentUser: async () => {},
  insertMetokenMetadata: async () => {},
  logout: async () => {},
  user: null,
} as const;

const OrbisContext = createContext<OrbisContextProps>(defaultContext);

const validateDbOperation = (
  id: string,
  value?: any,
  select: boolean = false
) => {
  if (!id) throw new Error("No id provided");
  if (!select && !value) throw new Error("No value provided");

  const requiredEnvVars = {
    NEXT_PUBLIC_ORBIS_ASSET_METADATA_MODEL_ID:
      process.env.NEXT_PUBLIC_ORBIS_ASSET_METADATA_MODEL_ID,
    NEXT_PUBLIC_ORBIS_CRTV_CONTEXT_ID:
      process.env.NEXT_PUBLIC_ORBIS_CRTV_CONTEXT_ID,
    NEXT_PUBLIC_ORBIS_CRTV_VIDEOS_CONTEXT_ID:
      process.env.NEXT_PUBLIC_ORBIS_CRTV_VIDEOS_CONTEXT_ID,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  if (!db) throw new Error("OrbisDB client is not initialized");
};

// Import Orbis dynamically to avoid SSR issues
let Orbis: any;
if (typeof window !== "undefined") {
  import("@useorbis/db-sdk").then((orbisModule) => {
    Orbis = orbisModule.OrbisDB;
  });
}

const CACHE_KEY = "orbis_session_cache";
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedSession {
  timestamp: number;
  data: SerializableAuthResult;
}

export function OrbisProvider({ children }: { children: ReactNode }) {
  const [authResult, setAuthResult] = useState<SerializableAuthResult | null>(
    null
  );
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orbisInstance, setOrbisInstance] = useState<any>(null);
  const accountKitUser = useUser();
  const { client: smartAccountClient } = useSmartAccountClient({});

  const {
    authenticateAsync,
    isPending,
    error: authError,
  } = useAuthenticate({
    onSuccess: async () => {
      // On successful Account Kit authentication, connect to Orbis
      if (accountKitUser && smartAccountClient) {
        try {
          const auth = new OrbisEVMAuth({
            request: async ({
              method,
              params,
            }: {
              method: string;
              params: unknown[];
            }) => {
              // Cast both method and params to satisfy Account Kit's type requirements
              return smartAccountClient.request({
                method: method as any,
                params: params as any,
              });
            },
          });
          const result = await db.connectUser({ auth });

          if (result) {
            setAuthResult({
              did: accountKitUser.address,
              details: { address: accountKitUser.address },
            });
            setIsUserConnected(true);
            setUser(result);
            // Update cache
            saveToCache({
              did: accountKitUser.address,
              details: JSON.parse(JSON.stringify(result)),
            });
          }
        } catch (error) {
          console.error(
            "Failed to connect to Orbis after authentication:",
            error
          );
        }
      }
    },
    onError: (error) => {
      console.error("Authentication error:", error);
      setIsUserConnected(false);
      setAuthResult(null);
      setUser(null);
    },
  });

  // Cache management functions
  const saveToCache = (data: SerializableAuthResult) => {
    try {
      const cache: CachedSession = {
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn("Failed to save to cache:", error);
    }
  };

  const loadFromCache = (): SerializableAuthResult | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { timestamp, data }: CachedSession = JSON.parse(cached);
      if (Date.now() - timestamp > SESSION_EXPIRY) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.warn("Failed to load from cache:", error);
      return null;
    }
  };

  useEffect(() => {
    // Check for existing session
    checkExistingSession();

    // Use Account Kit user instead of window.ethereum
    if (accountKitUser) {
      setAuthResult({
        did: accountKitUser.address,
        details: { address: accountKitUser.address },
      });
      setIsUserConnected(true);
      setUser({ address: accountKitUser.address });
    }

    const initOrbis = async () => {
      try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_CERAMIC_NODE_URL) {
          throw new Error("NEXT_PUBLIC_CERAMIC_NODE_URL is not defined");
        }
        if (!process.env.NEXT_PUBLIC_ORBIS_NODE_URL) {
          throw new Error("NEXT_PUBLIC_ORBIS_NODE_URL is not defined");
        }
        if (!process.env.NEXT_PUBLIC_ORBIS_ENVIRONMENT_ID) {
          throw new Error("NEXT_PUBLIC_ORBIS_ENVIRONMENT_ID is not defined");
        }

        // Wait for Orbis to be dynamically imported
        if (!Orbis) {
          console.log("Waiting for Orbis to be imported...");
          const orbisModule = await import("@useorbis/db-sdk");
          Orbis = orbisModule.OrbisDB;
          console.log("Orbis imported successfully:", !!Orbis);
        }

        console.log("Initializing Orbis...");
        const newOrbisInstance = new Orbis({
          ceramic: {
            gateway: process.env.NEXT_PUBLIC_CERAMIC_NODE_URL,
          },
          nodes: [
            {
              gateway: process.env.NEXT_PUBLIC_ORBIS_NODE_URL,
              env: process.env.NEXT_PUBLIC_ORBIS_ENVIRONMENT_ID,
            },
          ],
        });

        // Apply client patches
        if (newOrbisInstance) {
          console.log("Orbis instance initialized");
        }

        setOrbisInstance(newOrbisInstance);

        // Check cache first
        const cachedSession = loadFromCache();
        if (cachedSession) {
          setAuthResult(cachedSession);
          setIsUserConnected(true);
          setUser(cachedSession.details);
        }

        // Check if user is already connected
        try {
          const connected = await db.isUserConnected();

          if (connected) {
            console.log("User already connected to Orbis:", connected);
            setIsUserConnected(true);
            const currentUser = await db.getConnectedUser();
            if (currentUser) {
              setUser(currentUser);
              // Update cache
              saveToCache({
                did: currentUser.user.did,
                details: JSON.parse(JSON.stringify(currentUser)),
              });
            }
          }
        } catch (error) {
          console.error("Failed to check user connection:", error);
          // If connection check fails, fall back to cache
          const cachedSession = loadFromCache();
          if (cachedSession) {
            setAuthResult(cachedSession);
            setIsUserConnected(true);
            setUser(cachedSession.details);
          }
        }
      } catch (error) {
        console.error("Error initializing Orbis:", error);
      }
    };

    initOrbis();
  }, [accountKitUser]);

  const checkExistingSession = async () => {
    try {
      if (!db) {
        console.error("OrbisDB client is not initialized");
        return;
      }

      const currentUser = await db.getConnectedUser();
      if (currentUser) {
        console.log("Found existing user session:", currentUser.user.did);
        setAuthResult({
          did: currentUser.user.did,
          details: JSON.parse(JSON.stringify(currentUser)),
        });
      } else {
        console.log("No existing user session found");
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
    }
  };

  const insert = async (modelId: string, value: any): Promise<void> => {
    try {
      validateDbOperation(modelId, value);

      const insertStatement = db
        .insert(modelId)
        .value(value)
        .context(
          process.env.NEXT_PUBLIC_ORBIS_CRTV_VIDEOS_CONTEXT_ID as string
        );

      const validation = await insertStatement.validate();

      if (!validation.valid) {
        throw new Error("Error during validation: " + validation.error);
      }

      const [result, error] = await catchError(() => insertStatement.run());

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      console.log("Insert successful:", result);
    } catch (error) {
      console.error("Failed to insert:", error);
      throw error;
    }
  };

  const replace = async (docId: string, newDoc: any): Promise<void> => {
    try {
      validateDbOperation(docId, newDoc);

      const replaceStatement = db.update(docId).replace(newDoc);
      const [result, error] = await catchError(() => replaceStatement.run());

      if (error) {
        console.error("Replace error:", error);
        throw error;
      }

      console.log("Replace successful:", result);
    } catch (error) {
      console.error("Failed to replace:", error);
      throw error;
    }
  };

  const update = async (docId: string, updates: any): Promise<void> => {
    try {
      validateDbOperation(docId, updates);

      const updateStatement = db.update(docId).set(updates);
      const [result, error] = await catchError(() => updateStatement.run());

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Update successful:", result);
    } catch (error) {
      console.error("Failed to update:", error);
      throw error;
    }
  };

  const getAssetMetadata = async (
    assetId: string
  ): Promise<AssetMetadata | null> => {
    try {
      validateDbOperation(assetId, true);

      const selectStatement = db
        .select()
        .from(process.env.NEXT_PUBLIC_ORBIS_ASSET_METADATA_MODEL_ID as string)
        .where({ assetId })
        .context(
          process.env.NEXT_PUBLIC_ORBIS_CRTV_VIDEOS_CONTEXT_ID as string
        );

      const [result, error] = await catchError(() => selectStatement.run());

      if (error) {
        console.error("Select statement error:", error);
        throw error;
      }

      const { rows } = result;
      if (!rows?.length) return null;

      const metadata: AssetMetadata = {
        assetId: rows[0].assetId,
        playbackId: rows[0].playbackId,
        title: rows[0].title,
        description: rows[0].description,
        location: rows[0].location,
        category: rows[0].category,
        thumbnailUri: rows[0].thumbnailUri,
        subtitlesUri: rows[0].subtitlesUri,
        subtitles: undefined,
      };

      if (metadata.subtitlesUri) {
        try {
          const response = await fetch(metadata.subtitlesUri);
          if (!response.ok) throw new Error("Failed to fetch subtitles");

          const res = await response.json();
          if (res) {
            metadata.subtitles = Object.fromEntries(
              Object.entries(res).map(([lang, chunks]) => [
                lang,
                (Array.isArray(chunks) ? chunks : []).map((chunk) => ({
                  text: String(chunk.text || ""),
                  timestamp: Array.isArray(chunk.timestamp)
                    ? [...chunk.timestamp]
                    : [],
                })),
              ])
            );
          }
        } catch (error) {
          console.error("Failed to fetch subtitles:", error);
        }
      }

      return metadata;
    } catch (error) {
      console.error("Failed to fetch asset metadata:", error);
      throw error;
    }
  };

  const orbisLogin = async (): Promise<OrbisConnectResult | null> => {
    try {
      if (!orbisInstance) {
        console.error("Orbis not initialized");
        return null;
      }

      console.log("Starting Account Kit authentication...");
      await authenticateAsync({
        type: "email",
        email: user?.email || "",
        emailMode: "otp",
      });
      return user;
    } catch (error) {
      console.error("Error in authentication:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await db.disconnectUser();
      setAuthResult(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const checkUserConnection = async (address?: string): Promise<boolean> => {
    try {
      return await db.isUserConnected(address);
    } catch (error) {
      console.error("Connection check error:", error);
      return false;
    }
  };

  const getCurrentUser = async () => {
    const currentUser = await db.getConnectedUser();
    if (!currentUser) {
      throw new Error(
        "No active user session. Please connect your wallet and sign in first."
      );
    }
    return currentUser;
  };

  const insertMetokenMetadata = async (metadata: {
    address: string;
    token_name: string;
    token_symbol: string;
  }): Promise<void> => {
    try {
      await insert(
        process.env.NEXT_PUBLIC_METOKEN_METADATA_MODEL_ID as string,
        metadata
      );
    } catch (error) {
      console.error("Failed to insert metoken metadata:", error);
      throw error;
    }
  };

  return (
    <OrbisContext.Provider
      value={{
        authResult,
        setAuthResult,
        insert,
        replace,
        update,
        getAssetMetadata,
        orbisLogin,
        isConnected: checkUserConnection,
        getCurrentUser,
        insertMetokenMetadata,
        logout,
        user,
      }}
    >
      {children}
    </OrbisContext.Provider>
  );
}

export function useOrbisContext() {
  const context = useContext(OrbisContext);
  if (!context) {
    throw new Error("useOrbisContext must be used within an OrbisProvider");
  }
  return context;
}
