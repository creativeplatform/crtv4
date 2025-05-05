"use client";

import { createContext, useContext, ReactNode } from "react";

interface OrbisContextType {
  isConnected: boolean;
}

const OrbisContext = createContext<OrbisContextType>({
  isConnected: false,
});

export function OrbisProvider({ children }: { children: ReactNode }) {
  // TODO: Implement actual connection logic
  const isConnected = true; // Temporary value for development

  return (
    <OrbisContext.Provider value={{ isConnected }}>
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
