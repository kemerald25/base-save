'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function MiniappReady() {
  useEffect(() => {
    // Call ready() to hide splash screen and display the app
    // This is required for Farcaster miniapps
    if (typeof window !== 'undefined' && sdk?.actions?.ready) {
      sdk.actions.ready().catch((error) => {
        console.warn('Failed to call sdk.actions.ready():', error);
      });
    }
  }, []);

  return null;
}
