import { getBestQualityDownload } from "./helpers";

interface QualityUrl {
    quality: string;
    url: string;
}

interface Artist {
    id: string;
    name: string;
    role: string;
    image: string[];
    type: string;
    url: string;
}

interface AlbumSong {
    id: string;
    name: string;
    downloadUrl: QualityUrl[];
    artists: {
        primary: Artist[];
        featured: Artist[];
        all: Artist[];
    };
}

interface SongResponse {
    downloadUrl: QualityUrl[];
}

export interface StreamingResult {
    url: string;
    name: string;
    primaryArtists: string;
}

const FETCH_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 500;

const SONG_BY_LINK_API = process.env.NEXT_PUBLIC_SONG_BY_LINK_API_URL;
const ALBUM_BY_LINK_API = process.env.NEXT_PUBLIC_ALBUM_BY_LINK_API_URL;

async function fetchWithRetry(url: string): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);

            }
            return response;
        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err instanceof Error ? err : new Error(String(err));

            if (attempt === MAX_RETRIES) break;

            const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw new Error(`Request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

function createEmptyStreamingResult(): StreamingResult {
    return { url: "", name: "", primaryArtists: "" };
}

function createStreamingResult(url: string, name = "", artists = ""): StreamingResult {
    return { url, name, primaryArtists: artists };
}

export async function getStreamingUrl(
    id: string,
    name: string,
    rawDownloadUrl: string | QualityUrl[],
): Promise<StreamingResult> {
    let urlStr = "";
    if (typeof rawDownloadUrl === "string") {
        urlStr = rawDownloadUrl;
    } else if (Array.isArray(rawDownloadUrl)) {
        urlStr = getBestQualityDownload(rawDownloadUrl) || rawDownloadUrl[0]?.url || "";
    }

    if (!urlStr) {
        console.warn("[Saavn] Invalid or missing downloadUrl: ", { id, name });
        return createEmptyStreamingResult();
    }

    if (
        urlStr.includes(".mp4") ||
        urlStr.includes(".m4a") ||
        urlStr.includes(".mp3") ||
        urlStr.includes("saavncdn.com")
    ) {
        return createStreamingResult(urlStr);
    }

    if (!SONG_BY_LINK_API || !ALBUM_BY_LINK_API) {
        console.error("[Saavn] Missing API environment variables");
        return createEmptyStreamingResult();
    }

    try {
        const encodedUrl = encodeURIComponent(urlStr);

        if (urlStr.includes("/song/")) {
            const response = await fetchWithRetry(`${SONG_BY_LINK_API}${encodedUrl}`);
            const data = await response.json() as { success: boolean; data: SongResponse[] };

            if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                const song = data.data[0];
                const url = getBestQualityDownload(song.downloadUrl);
                return url ? createStreamingResult(url) : createEmptyStreamingResult();
            }
            return createEmptyStreamingResult();
        }

        if (urlStr.includes("/album/")) {
            const response = await fetchWithRetry(`${ALBUM_BY_LINK_API}${encodedUrl}`);
            const data = await response.json() as {
                success: boolean; data: { songs: AlbumSong[] }
            };

            if (data.success && Array.isArray(data.data.songs)) {
                const songs = data.data.songs;

                const normalizedName = name?.trim().toLowerCase() || "";
                const match = songs.find((song) =>
                    song.id === id ||
                    song.name.trim().toLowerCase() === normalizedName
                );

                const selected = match ?? songs[0];

                if (selected) {
                    const url = getBestQualityDownload(selected.downloadUrl);
                    const primaryArtists = selected.artists?.primary
                        ?.map((artist: Artist) => artist.name)
                        .join(", ") || "Unknown Artist";
                    return createStreamingResult(url, selected.name, primaryArtists);
                }
            }
            return createEmptyStreamingResult();
        }

        console.warn("[Saavn] Unsupported downloadUrl pattern", urlStr);
        return createEmptyStreamingResult();

    } catch (error) {
        console.error("[Saavn] Error fetching streaming URL:", error);
        return createEmptyStreamingResult();
    }
}