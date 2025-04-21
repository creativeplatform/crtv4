// CustomAuthProvider.tsx
'use client';

import React, { ReactNode } from 'react';
import { AlchemyAccountProvider } from '@account-kit/react';
import { AlchemyClientState } from '@account-kit/core';
import { config as appConfig, queryClient } from '@/config';

interface CustomAuthProviderProps {
  children: ReactNode;
  initialState?: AlchemyClientState;
}

export function CustomAuthProvider({ children, initialState }: CustomAuthProviderProps) {
  return (
    <AlchemyAccountProvider
      config={appConfig}
      queryClient={queryClient}
      initialState={initialState}
    >
      {children}
    </AlchemyAccountProvider>
  );
}
