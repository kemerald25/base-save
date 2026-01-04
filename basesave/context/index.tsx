'use client';

import { wagmiAdapter, projectId } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { base } from '@reown/appkit/networks';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';

// Set up queryClient
const queryClient = new QueryClient();

// Set up metadata
const metadata = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Mini App',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A Base Mini App',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://example.com',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Always create AppKit (even without projectId, it will work in miniapp mode)
// Use a dummy projectId if none is provided to prevent errors
const appKitProjectId = projectId || '00000000000000000000000000000000';
  createAppKit({
    adapters: [wagmiAdapter],
  projectId: appKitProjectId,
    networks: [base],
    defaultNetwork: base,
    metadata: metadata,
    features: {
    analytics: !!projectId, // Only enable analytics if projectId is set
    },
  });

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);
  
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
