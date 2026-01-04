'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

export function OnchainKitWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OnchainKitProvider 
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ''} 
      chain={base}
    >
      {children}
    </OnchainKitProvider>
  );
}
