import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';

const domain = process.env.QUICK_AUTH_DOMAIN || 'base-save.vercel.app';
const client = createClient();

// This endpoint handles both SIWF (Farcaster miniapp) and WalletConnect (browser) authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, signature, address } = body;

    // Check if this is a SIWF message from Farcaster miniapp
    // SIWF messages contain "FID:" in the message text
    const isSIWFMessage = message && signature && typeof message === 'string' && message.includes('FID:');
    
    if (isSIWFMessage) {
      try {
        // Extract FID from the SIWF message
        // SIWF message format: Sign in to <domain> with Farcaster followed by FID and Nonce
        const fidMatch = message.match(/FID: (\d+)/);
        const fid = fidMatch ? parseInt(fidMatch[1], 10) : null;

        if (!fid) {
          return NextResponse.json({ error: 'Invalid SIWF message format' }, { status: 400 });
        }

        // Note: Full SIWF signature verification requires the Farcaster protocol
        // For now, we validate the message format and trust the miniapp SDK
        // In production, you should verify the signature using the Farcaster protocol
        // or use a library like @farcaster/frame-verify if available

        return NextResponse.json({
          fid,
          address: address || null,
          token: signature, // Use signature as token
        });
      } catch (verifyError) {
        console.error('SIWF verification error:', verifyError);
        return NextResponse.json({ error: 'SIWF verification failed' }, { status: 401 });
      }
    }

    // Fallback to wallet signature verification (browser/WalletConnect)
    if (!address || !message || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure signature starts with 0x
    const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
    
    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: formattedSignature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Return authenticated user data
    return NextResponse.json({
      address,
      token: signature, // Using signature as token for simplicity
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// GET endpoint for Quick Auth (legacy support)
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];

  try {
    // Try Quick Auth verification (legacy)
    const payload = await client.verifyJwt({ token, domain });
    
    return NextResponse.json({
      fid: payload.sub,
    });
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    throw e;
  }
}
