import { NextResponse } from 'next/server';

// This is the endpoint your admin frontend will call.
export async function GET() {
    const externalApiUrl = 'https://submission.valhallanft.xyz/api/external-wallets';
    const apiKey = process.env.EXTERNAL_API_KEY;

    if (!apiKey) {
        console.error("FATAL: EXTERNAL_API_KEY is not set in the environment variables.");
        return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
    }

    try {
        // This request is made from your server to the external server,
        // securely including the API key.
        const response = await fetch(externalApiUrl, {
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            // Forward the error from the external API
            const errorData = await response.json();
            return NextResponse.json({ error: errorData.error || `External API failed with status: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Failed to fetch from external wallets API:", error);
        return NextResponse.json({ error: 'Failed to fetch wallet data.' }, { status: 500 });
    }
}
