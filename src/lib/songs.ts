export interface Artist {
    id: string;
    name: string;
    follower_count: string | number;
    image: string;
    url: string;
    role?: string;
}

export interface Album {
    id: string;
    name: string;
    primaryArtists: string;
    image: string;
    downloadUrl: string;
    streamingUrl: string;
}

export interface Song {
    id: string;
    name: string;
    primaryArtists: string;
    image: string;
    downloadUrl: string;
    streamingUrl: string;
    url?: string;
    language?: string;
    album?: { name: string };
    artists?: {
        primary?: Artist[];
        featured?: Artist[];
        all?: Artist[];
    };
    _weight?: number;
}

export async function fetchNewReleasesFromJioSaavn(): Promise<Song[]> {
    const apiUrl = process.env.NEXT_PUBLIC_SANVIA_BACKEND_API_URL;

    if (!apiUrl) {
        console.error("Render API URL not set in environment variables.");
        return [];
    }

    try {
        const response = await fetch(`${apiUrl}/new-releases`, { cache: "no-store" });

        const data = await response.json();
        if (!Array.isArray(data)) {
            console.warn('Unexpected data format, expected array');
            return [];
        }

        return data.map((item) => ({
            id: item.id || "",
            name: item.name || "",
            primaryArtists: item.primaryArtists || "",
            image: item.image || "",
            downloadUrl: item.downloadUrl || "",
        })) as Song[];

    } catch (err) {
        console.error("Failed to load new releases after retries:", err)
        return []
    }
}

export async function fetchNowTrendingSongsFromJioSaavn(): Promise<Song[]> {
    const apiUrl = process.env.NEXT_PUBLIC_SANVIA_BACKEND_API_URL

    if (!apiUrl) {
        throw new Error("Render API URL not set in environment variables.");
    }

    try {
        const response = await fetch(`${apiUrl}/now-trending`, { next: { revalidate: 10800 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch trending songs: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate and map data to Song[]
        if (Array.isArray(data)) {
            return data.map((item) => ({
                id: item.id || "",
                name: item.name || "",
                primaryArtists: item.primaryArtists || "",
                image: item.image || "",
                downloadUrl: item.downloadUrl || "",
                streamingUrl: item.streamingUrl || "",
            })) as Song[];
        }

        throw new Error("Unexpected data format from API");
    } catch (error) {
        console.error("Error fetching trending songs:", error);
        throw error;
    }
}

export async function fetchAlbumsFromJioSaavn(): Promise<Album[]> {
    const apiUrl = process.env.NEXT_PUBLIC_SANVIA_BACKEND_API_URL

    if (!apiUrl) {
        throw new Error("Render API URL not set in environment variables.");
    }

    try {
        const response = await fetch(`${apiUrl}/albums`, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Failed to fetch albums: ${response.statusText}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            return data.map((item) => ({
                id: item.id || "",
                name: item.name || "",
                primaryArtists: item.primaryArtists || "",
                image: item.image || "",
                downloadUrl: item.perma_url || "",
            })) as Album[];
        }

        throw new Error("Unexpected data format from API");
    } catch (error) {
        console.error("Error fetching albums:", error);
        throw error;
    }
}

export async function fetchTopArtistsFromJioSaavn(): Promise<Artist[]> {
    const apiUrl = process.env.NEXT_PUBLIC_SANVIA_BACKEND_API_URL

    if (!apiUrl) {
        throw new Error("Render API URL not set in environment variables.");
    }

    try {
        const response = await fetch(`${apiUrl}/top-artists`, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Failed to fetch top artists: ${response.statusText}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            return data.map((item) => ({
                id: item.id || "",
                name: item.name || "",
                follower_count: item.follower_count || "",
                image: item.image || "",
                url: item.url || "",
            })) as Artist[];
        }

        throw new Error("Unexpected data format from API");
    } catch (error) {
        console.error("Error fetching top artists:", error);
        throw error;
    }
}

export async function downloadSong(
    streamingUrl: string,
    songTitle: string,
    onProgress: (percentage: number) => void
) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_SANVIA_BACKEND_API_URL;
        if (!apiUrl) throw new Error("API URL not configured");

        const response = await fetch(`${apiUrl}/download-song`, {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                streamingUrl,
                title: songTitle
            })
        });

        if (!response.ok || !response.body) {
            throw new Error('Failed to download song');
        }

        const contentLength = response.headers.get('Content-Length');
        if (!contentLength) {
            throw new Error('Content-Length response header unavailable');
        }

        const total = parseInt(contentLength, 10);
        let loaded = 0;
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                chunks.push(value);
                loaded += value.length;
                const percent = Math.round((loaded / total) * 100);
                onProgress(percent);
            }
        }

        const blob = new Blob(chunks);
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${songTitle}_MP3_320K.mp3`;
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Error downloading song:", err);
        onProgress(0);
    }
}

export async function searchFromJioSaavn(query: string): Promise<Song[]> {
    const apiUrl = process.env.NEXT_PUBLIC_SANVIA_BACKEND_API_URL;

    if (!apiUrl) {
        console.error("Render API URL not set in environment variables.");
        return [];
    }

    if (!query || query.trim().length === 0) {
        return [];
    }
    console.log("songs.ts => query:", query);
    try {
        const response = await fetch(`${apiUrl}/search?query=${encodeURIComponent(query)}`, {
            cache: "no-store"
        });

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.warn("Unexpected search response format, expected an array");
            return [];
        }

        return data.map((item) => ({
            id: item.id || "",
            name: item.name || "",
            primaryArtists: item.primaryArtists || "",
            image: item.image || "",
            downloadUrl: item.downloadUrl || "",
            streamingUrl: item.streamingUrl || "",
            url: item.url || "",
        })) as Song[];

    } catch (error) {
        console.error("Error searching songs:", error);
        return [];
    }
}
