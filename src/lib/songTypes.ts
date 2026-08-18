export interface Artist {
    id: string;
    name: string;
    follower_count: string | number;
    image: string;
    url: string;
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
    image: string | { quality: string; url: string }[];
    downloadUrl: string | { quality: string; url: string }[];
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

interface RawAlbum {
    id: string;
    name: string;
    url: string;
    image: Array<{ quality: string; url: string }> | string;
    artists?: {
        primary?: Array<{ name: string }>;
    };
}

const SANVIA_BASE_API = process.env.NEXT_PUBLIC_SANVIA_BASE_API_URL;
const TRENDING_PLAYLIST_ID = process.env.NEXT_PUBLIC_TRENDING_PLAYLIST_ID;
const PLAYLIST_BY_ID_API = process.env.NEXT_PUBLIC_PLAYLIST_BY_ID_API_URL;
const ALBUM_SEARCH_API = process.env.NEXT_PUBLIC_ALBUM_SEARCH_API_URL;

export async function fetchNewReleasesFromJioSaavn(retries = 3): Promise<Song[]> {
    if (!SANVIA_BASE_API) {
        console.error("Render API URL not set in environment variables.");
        return [];
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${SANVIA_BASE_API}/new-releases`, {
                cache: "no-store",
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

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
            console.error(`Attempt ${attempt} failed:`, err);
            if (attempt === retries) {
                return [];
            }

            await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
        }
    }

    return [];
}

export async function fetchNowTrendingSongs(): Promise<Song[]> {
    const LIMIT = 12;

    if (!PLAYLIST_BY_ID_API) {
        throw new Error("Render API URL not set in environment variables.");
    }

    const endpoint = `${PLAYLIST_BY_ID_API}${TRENDING_PLAYLIST_ID}&limit=${LIMIT}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Failed to fetch trending playlist: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success || !data.data || !Array.isArray(data.data.songs)) {
            throw new Error("Unexpected API response structure");
        }

        const songs = data.data.songs;

        return songs.map((item: Song) => {
            let primaryArtists = "";
            if (item.artists?.primary?.length) {
                primaryArtists = item.artists.primary.map((artist: Artist) => artist.name).join(", ");
            } else if (item.artists?.all?.length) {
                primaryArtists = item.artists.all.map((artist: Artist) => artist.name).join(", ");
            } else {
                primaryArtists = item.primaryArtists || "";
            }

            let image = "";
            if (Array.isArray(item.image)) {
                const img500 = item.image.find((img) => img.quality === "500x500");
                image = img500?.url || item.image[0]?.url || "";
            } else if (typeof item.image === "string") {
                image = item.image;
            }

            let downloadUrl = "";
            if (Array.isArray(item.downloadUrl)) {
                const url320 = item.downloadUrl.find((q) => q.quality === "320kbps");
                downloadUrl = url320?.url || item.downloadUrl[0]?.url || "";
            }
            if (!downloadUrl && item.url) {
                downloadUrl = item.url;
            }

            const streamingUrl = downloadUrl || "";

            return {
                id: item.id || "",
                name: item.name || "",
                primaryArtists,
                image,
                downloadUrl,
                streamingUrl,
            } as Song;
        });

    } catch (error) {
        console.error("Error fetching trending songs:", error);
        throw error;
    }
}

async function searchAlbums(term: string, limit = 20, page = 0): Promise<Album[]> {
    if (!ALBUM_SEARCH_API) return [];

    const url = `${ALBUM_SEARCH_API}${encodeURIComponent(term)}&limit=${limit}&page=${page}`;

    try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) return [];

        const json = await res.json();
        if (!json.success || !Array.isArray(json.data?.results)) return [];

        return json.data.results.map((item: RawAlbum) => {
            let image = "";
            if (Array.isArray(item.image)) {
                const img500 = item.image.find(img => img.quality === "500x500");
                image = img500?.url || item.image[0]?.url || "";
            } else if (typeof item.image === "string") {
                image = item.image;
            }

            let primaryArtists = "";
            if (item.artists?.primary?.length) {
                primaryArtists = item.artists.primary.map(artist => artist.name).join(", ");
            }

            return {
                id: item.id || "",
                name: item.name || "",
                primaryArtists,
                image,
                downloadUrl: item.url || "",
            };
        });
    } catch {
        return [];
    }
}

function generateRandomTwoLetterTerms(count: number): string[] {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const terms = new Set<string>();
    while (terms.size < count) {
        const firstLetter = letters[Math.floor(Math.random() * 26)];
        terms.add(firstLetter);
    }

    return Array.from(terms);
}

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export async function fetchRandomAlbums(): Promise<Album[]> {
    const uniqueMap = new Map<string, Album>();
    const maxAttempts = 3;
    let attempts = 0;

    while (uniqueMap.size < 12 && attempts < maxAttempts) {
        const termCount = 10;
        const twoLetterTerms = generateRandomTwoLetterTerms(termCount);

        const termsWithPage = twoLetterTerms.map(term => ({
            term,
            page: Math.floor(Math.random() * 6),
        }));

        const results = await Promise.all(
            termsWithPage.map(({ term, page }) => searchAlbums(term, 20, page))
        );

        for (const albums of results) {
            const shuffledTermAlbums = shuffleArray(albums);
            const diverseSelection = shuffledTermAlbums.slice(0, 2);
            for (const album of diverseSelection) {
                if (album.id && !uniqueMap.has(album.id)) {
                    uniqueMap.set(album.id, album);
                }
            }
        }
        attempts++;
    }

    if (uniqueMap.size < 12) {
        const fallbackTerm = 'hindi';
        const fallbackPage = Math.floor(Math.random() * 6);
        const fallbackAlbums = await searchAlbums(fallbackTerm, 20, fallbackPage);

        const shuffledFallback = shuffleArray(fallbackAlbums);
        for (const album of shuffledFallback) {
            if (uniqueMap.size >= 12) break;
            if (album.id && !uniqueMap.has(album.id)) {
                uniqueMap.set(album.id, album);
            }
        }
    }

    const uniqueAlbums = Array.from(uniqueMap.values());
    return shuffleArray(uniqueAlbums).slice(0, 12);
}

export async function fetchTopArtistsFromJioSaavn(): Promise<Artist[]> {
    if (!SANVIA_BASE_API) {
        throw new Error("Render API URL not set in environment variables.");
    }

    try {
        const response = await fetch(`${SANVIA_BASE_API}/top-artists`, { cache: "no-store" });

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
    primaryArtists: string,
    onProgress: (percentage: number) => void
): Promise<void> {
    if (!streamingUrl) {
        throw new Error("No streaming URL provided");
    }

    const endpoint = "/api/download-song"
    const payload = { streamingUrl, songTitle, primaryArtists };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server responded with ${response.status}: ${errorText || "Unknown error"}`);
        }

        if (!response.body) {
            throw new Error("Response body is empty (no stream)");
        }

        const contentLengthHeader = response.headers.get('Content-Length');
        const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (value) {
                chunks.push(value);
                receivedBytes += value.length;

                if (totalBytes > 0) {
                    const percent = Math.round((receivedBytes / totalBytes) * 100);
                    onProgress(Math.min(percent, 100));
                } else {
                    if (chunks.length === 1) {
                        onProgress(99);
                    }
                }
            }
        }

        const blob = new Blob(chunks.map(chunk => new Uint8Array(chunk)), { type: 'audio/mpeg' });
        const objectUrl = window.URL.createObjectURL(blob);

        const safeTitle = songTitle
            .replace(/[/\\?%*:|"<>]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 150);

        const safeArtist = (primaryArtists || 'Unknown Artist')
            .replace(/[/\\?%*:|"<>]/g, ' ')
            .trim();

        const fileName = `${safeTitle} - ${safeArtist} (320K) - Sanvia.mp3`;

        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();

        if (anchor.parentNode) {
            anchor.parentNode.removeChild(anchor);
        }

        setTimeout(() => {
            window.URL.revokeObjectURL(objectUrl)
        }, 1500);

        onProgress(100);

    } catch (error) {
        onProgress(0);
        const message = error instanceof Error ? error.message : "Unknown download error";
        throw new Error(`Download failed: ${message}`);
    }
}