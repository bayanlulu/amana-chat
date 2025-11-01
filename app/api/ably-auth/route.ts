import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export async function GET(request: NextRequest) {
  try {
    // Get the secret API key from environment variables .env.local
    const apiKey = process.env.ABLY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Ably API key not configured' },
        { status: 500 }
      );
    }

    // Extract client ID from query parameters or generate a random one
    const clientId = request.nextUrl.searchParams.get('clientId') || 
                    `user-${Math.random().toString(36).substring(7)}`;

    // Initialize Ably with the secret key
    const ably = new Ably.Rest(apiKey);

    // Create a token request with the client ID
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: clientId,
      capability: {
        'amana-chat:*': ['publish', 'subscribe', 'presence']
      }
    });

    // Return the token request to the client
    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Error creating Ably token:', error);
    return NextResponse.json(
      { error: 'Failed to create authentication token' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';