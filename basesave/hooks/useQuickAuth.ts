'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useSignMessage } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';

interface AuthState {
  token: string | null;
  userData: { fid?: number; address?: string } | null;
  isLoading: boolean;
}

// Detect if we're in Farcaster miniapp environment
function isFarcasterMiniapp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // Check if sdk is available and has actions (miniapp SDK)
    return (
      typeof sdk !== 'undefined' && 
      sdk !== null && 
      sdk.actions &&
      typeof sdk.actions.signIn === 'function'
    );
  } catch {
    return false;
  }
}

// Generate a random nonce for SIWF
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Storage keys for persisting auth state
const AUTH_TOKEN_KEY = 'farcaster_auth_token';
const AUTH_USER_DATA_KEY = 'farcaster_auth_user_data';

// Load persisted auth state from storage
function loadAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { token: null, userData: null, isLoading: false };
  }
  
  try {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const userDataStr = sessionStorage.getItem(AUTH_USER_DATA_KEY);
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    
    return {
      token,
      userData,
      isLoading: false,
    };
  } catch {
    return { token: null, userData: null, isLoading: false };
  }
}

// Save auth state to storage
function saveAuthState(token: string | null, userData: { fid?: number; address?: string } | null) {
  if (typeof window === 'undefined') return;
  
  try {
    if (token) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
    
    if (userData) {
      sessionStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userData));
    } else {
      sessionStorage.removeItem(AUTH_USER_DATA_KEY);
    }
  } catch (error) {
    console.warn('Failed to save auth state:', error);
  }
}

export function useQuickAuth() {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);

  const isMiniapp = isFarcasterMiniapp();
  const { address, isConnected, connector } = useAccount();
  // Always initialize AppKit (it's needed for wallet connection outside miniapp)
  const appKit = useAppKit();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const addressRef = useRef(address);
  const hasAutoSignedIn = useRef(false);
  
  // Check if connector is ready
  const isConnectorReady = connector && typeof connector.getChainId === 'function';

  // Keep address ref in sync
  useEffect(() => {
    addressRef.current = address;
  }, [address]);
  
  // Update persisted state when authState changes
  useEffect(() => {
    saveAuthState(authState.token, authState.userData);
  }, [authState.token, authState.userData]);

  async function signIn() {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      // Use Farcaster miniapp SDK for authentication
      // Note: Wallet connection is handled automatically by wagmi in miniapp environment
      if (isMiniapp) {
        try {
          // Sign in with Farcaster (SIWF)
          const nonce = generateNonce();
          const { message, signature } = await sdk.actions.signIn({ 
            nonce,
            acceptAuthAddress: true 
          });

          // Send to backend for verification
          const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || window.location.origin;
          const response = await fetch(`${backendOrigin}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              signature,
              address: address || null, // Use wagmi's address if available
            }),
          });

          if (!response.ok) {
            throw new Error('Authentication failed');
          }

          const data = await response.json();
          
          const newAuthState = {
            token: signature, // Use signature as token
            userData: {
              fid: data.fid,
              address: address || data.address || null,
            },
            isLoading: false,
          };
          
          setAuthState(newAuthState);
          saveAuthState(newAuthState.token, newAuthState.userData);
          return; // Success, exit early
        } catch (miniappError) {
          // If miniapp auth fails, fall back to AppKit
          console.warn('Miniapp authentication failed, falling back to AppKit:', miniappError);
          // Continue to AppKit flow below
        }
      }
      
      // Use Reown AppKit (WalletConnect) for browser or if Quick Auth failed
      let currentAddress = addressRef.current;
      
      if (!isConnected || !currentAddress) {
        // Open AppKit modal to connect wallet
        if (appKit?.open) {
          appKit.open();
        } else {
          throw new Error('Wallet connection not available. Please set NEXT_PUBLIC_PROJECT_ID or use the app in a Farcaster miniapp.');
        }
        
        // Wait for connection to establish and account to be available
        // Poll for address with timeout (max 10 seconds)
        let attempts = 0;
        while (!currentAddress && attempts < 100) {
          await new Promise(resolve => setTimeout(resolve, 100));
          currentAddress = addressRef.current;
          attempts++;
        }
        
        if (!currentAddress) {
          throw new Error('Wallet connection failed. Please connect your wallet and try again.');
        }
      }

      // Ensure we have an address
      if (!currentAddress) {
        throw new Error('Wallet address not available');
      }

      // Ensure wallet is connected and ready
      if (!isConnected || !currentAddress) {
        throw new Error('Wallet not connected');
      }

      // Wait a bit for connector to be fully ready
      if (!isConnectorReady) {
        // Give the connector a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!connector || typeof connector.getChainId !== 'function') {
          throw new Error('Wallet connector not ready. Please reconnect your wallet.');
        }
      }

      // Wait a bit for connector to be fully ready if needed
      if (!isConnectorReady && connector) {
        // Give the connector a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!connector || typeof connector.getChainId !== 'function') {
          throw new Error('Wallet connector not ready. Please reconnect your wallet.');
        }
      }

      // Sign a message for authentication
      const message = `Sign in to this app at ${new Date().toISOString()}`;
      
      try {
        const signature = await signMessageAsync({ message });

        // Send to backend for verification
        const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || window.location.origin;
        const response = await fetch(`${backendOrigin}/api/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: currentAddress,
            message,
            signature,
          }),
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        const token = data.token || signature; // Use signature as token if backend doesn't provide one

        const newAuthState = {
          token,
          userData: { address: currentAddress, ...data },
          isLoading: false,
        };
        
        setAuthState(newAuthState);
        saveAuthState(newAuthState.token, newAuthState.userData);
      } catch (signError: any) {
        // Handle user rejection gracefully
        if (signError?.name === 'UserRejectedRequestError' || 
            signError?.code === 4001 || 
            signError?.message?.includes('rejected') ||
            signError?.message?.includes('User rejected')) {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          throw new Error('Sign-in cancelled. Please try again when ready.');
        }
        // Handle wallet connection errors
        if (signError?.message?.includes('connector') || signError?.message?.includes('ChainId')) {
          console.error('Wallet connection error:', signError);
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          throw new Error('Wallet connection issue. Please reconnect your wallet and try again.');
        }
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw signError;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }

  // Auto-sign in when in miniapp environment (only once per session)
  useEffect(() => {
    // Only auto-sign-in if:
    // 1. We're in a miniapp
    // 2. We haven't already attempted auto-sign-in
    // 3. We don't have a token (not authenticated)
    // 4. We're not currently loading
    if (isMiniapp && !hasAutoSignedIn.current && !authState.token && !authState.isLoading) {
      hasAutoSignedIn.current = true;
      signIn().catch((error) => {
        console.error('Auto sign-in failed:', error);
        hasAutoSignedIn.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMiniapp]); // Only depend on isMiniapp, not authState.token to avoid re-triggering

  function signOut() {
    if (!isMiniapp && isConnected) {
      disconnect();
    }
    hasAutoSignedIn.current = false; // Reset so user can sign in again if needed
    setAuthState({
      token: null,
      userData: null,
      isLoading: false,
    });
    saveAuthState(null, null); // Clear persisted state
  }

  return {
    ...authState,
    signIn,
    signOut,
    isAuthenticated: isMiniapp ? !!authState.token : (isConnected && !!authState.token),
  };
}
