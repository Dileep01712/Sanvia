import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { streamingUrl, songTitle, primaryArtists } = body;

        if (!streamingUrl || !songTitle || !primaryArtists) {
            return NextResponse.json(
                { error: 'Missing streamingUrl or songTitle or primaryArtists' },
                { status: 400 }
            );
        }

        const response = await fetch(streamingUrl, {
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch audio: ${response.status}` },
                { status: response.status }
            );
        }

        if (!response.body) {
            return NextResponse.json(
                { error: 'No response body' },
                { status: 500 }
            );
        }

        const contentLength = response.headers.get("content-length");

        const cleanTitle = songTitle
            .replace(/&quot;/g, '”')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

        const cleanArtist = (primaryArtists || 'Unknown Artist')
            .replace(/&quot;/g, '”')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

        const fileName = `${cleanTitle} - ${cleanArtist} (320K) - Sanvia.mp3`;

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        const encodedFileName = encodeURIComponent(fileName);
        headers.set(
            'Content-Disposition',
            `attachment; filename="Sanvia_Audio.mp3"; filename*=UTF-8''${encodedFileName}`
        );

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Download error: ", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}