import { NextRequest, NextResponse } from "next/server";
import { decodeHTMLEntities } from "@/lib/helpers";

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

        const safeTitle = songTitle
            .replace(/[/\\?%*:|"<>]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 150);

        const safeArtist = (primaryArtists || 'Unknown Artist')
            .replace(/[/\\?%*:|"<>]/g, ' ')
            .trim();

        const fileName = `${decodeHTMLEntities(safeTitle)} - ${decodeHTMLEntities(safeArtist)} (320K) - Sanvia.mp3`;

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

        return new NextResponse(response.body, {
            status: 200,
            headers,
        }
        )
    } catch (error) {
        console.error("Download error: ", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}