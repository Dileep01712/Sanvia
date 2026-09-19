import { decodeHTMLEntities } from "./helpers";

export interface Artist {
    id: string;
    name: string;
    follower_count: string | number;
    image: string;
    url: string;
    type?: string;
    role?: string;
}

export interface Album {
    id: string;
    name: string;
    primaryArtists: string;
    image: string;
    downloadUrl: string;
    streamingUrl: string;
    type?: string;
    url?: string;
}

export interface Song {
    id: string;
    name: string;
    type?: string;
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
const VIRAL_PLAYLIST_ID = process.env.NEXT_PUBLIC_VIRAL_NATION_PLAYLIST_ID;
const ALBUM_SEARCH_API = process.env.NEXT_PUBLIC_ALBUM_SEARCH_API_URL;

interface RawSongItem {
    id?: string;
    name?: string;
    primaryArtists?: string;
    image?: string | Array<{ quality: string; url: string }>;
    downloadUrl?: string | Array<{ quality: string; url: string }>;
    url?: string;
    type?: string;
    artists?: {
        primary?: Array<{ name: string }>;
        all?: Array<{ name: string }>;
    };
}

interface WeightedArtist {
    name: string;
    weight: number;
}


const DEFAULT_LIST_SIZE = 12;
const TARGET_SONGS = DEFAULT_LIST_SIZE;
const ABSOLUTE_MAX_PER_ARTIST = 3;
const HISTORY_SEED_LIMIT = 6;
const FALLBACK_SEED_LIMIT = 3;
const MAX_ALBUM_KEY_LENGTH = 3;

const ARTIST_BUCKETS: readonly (readonly string[])[] = [
    ["Arijit Singh", "Shreya Ghoshal", "Pritam", "Tanishk Bagchi", "Vishal Mishra", "Amit Trivedi", "Jubin Nautiyal", "Neha Kakkar", "Armaan Malik", "Atif Aslam", "Sonu Nigam", "Udit Narayan", "Alka Yagnik", "Kumar Sanu", "A.R. Rahman", "Sachet-Parampara", "B Praak", "Sachin-Jigar", "Mithoon"],
    ["Diljit Dosanjh", "Karan Aujla", "AP Dhillon", "Guru Randhawa", "Harrdy Sandhu", "Sidhu Moose Wala", "Badshah", "Yo Yo Honey Singh", "Shubh"],
    ["Pawan Singh", "Khesari Lal Yadav", "Neelkamal Singh", "Shilpi Raj", "Ritesh Pandey", "Manoj Tiwari", "Dinesh Lal Yadav", "Pramod Premi Yadav"],
    ["Ajay-Atul", "Adarsh Shinde", "Avadhoot Gupte", "Bela Shende", "Swapnil Bandodkar", "Aarya Ambekar", "Shreya Ghoshal Marathi"],
    ["Anirudh Ravichander", "Ilaiyaraaja", "S.P. Balasubrahmanyam", "Sid Sriram", "Devi Sri Prasad", "Thaman S", "K.S. Chithra", "Hariharan", "Vijay Prakash"],
    ["Prateek Kuhad", "Anuv Jain", "King", "Divine", "KRSNA", "MC Stan", "Mitraz"],
];

const sanitizeName = (name: string): string =>
    name.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "").slice(0, 15);

const getAlbumKey = (songName: string): string | null =>
    songName.match(/\(from\s+["']?([^)"']+)["']?\)/i)?.[1]
        .toLowerCase()
        .replace(/\b(the|original|motion|picture|soundtrack|revenge|part)\b/g, "")
        .replace(/[^a-z0-9 ]/g, "")
        .trim()
        .split(" ")
        .find(Boolean) ?? null;

const primaryArtistKey = (song: Song): string =>
    (song.primaryArtists ?? "").split(",")[0]?.trim().toLowerCase() ?? "";

const extractArtistString = (song: Song): string => {
    const raw = song.primaryArtists || song.artists?.primary?.map(a => a.name).join(", ") || "";
    return raw ? decodeHTMLEntities(raw) : "";
};

const extractImage = (image: RawSongItem["image"]): string =>
    typeof image === "string" ? image : (Array.isArray(image) ? image.find(i => i.quality === "500x500")?.url || image[0]?.url || "" : "");

const extractDownloadUrl = (item: RawSongItem): string =>
    Array.isArray(item.downloadUrl) ? item.downloadUrl.find(q => q.quality === "320kbps")?.url || item.downloadUrl[0]?.url || "" : item.url || "";

const parseItem = (item: RawSongItem): Song | null => {
    if (!item.id) return null;
    const rawArtists = item.primaryArtists || item.artists?.primary?.map(a => a.name).join(", ") || item.artists?.all?.map(a => a.name).join(", ") || "";
    const downloadUrl = extractDownloadUrl(item);

    return {
        id: item.id,
        name: decodeHTMLEntities(item.name || ""),
        primaryArtists: decodeHTMLEntities(rawArtists),
        image: extractImage(item.image),
        downloadUrl,
        streamingUrl: downloadUrl,
        type: item.type || "song",
    };
};

const extractResults = (data: unknown): RawSongItem[] => {
    const d = data as { data?: { results?: RawSongItem[] }; results?: RawSongItem[] } | RawSongItem[] | null | undefined;
    return Array.isArray(d) ? d : d?.data?.results ?? d?.results ?? [];
};

const parseSongsDeduped = (items: RawSongItem[]): Song[] => {
    const seen = new Set<string>();
    return items.reduce<Song[]>((acc, item) => {
        const parsed = parseItem(item);
        if (!parsed) return acc;
        const key = sanitizeName(parsed.name);
        if (!seen.has(key)) { seen.add(key); acc.push(parsed); }
        return acc;
    }, []);
};

const extractHistoryArtists = (history: { song: Song }[]): WeightedArtist[] => {
    const weights: Record<string, number> = {};
    history.forEach(({ song }) => {
        extractArtistString(song)
            .split(",")
            .map(a => a.trim())
            .filter(a => a && a !== "Unknown Artist")
            .forEach((name, idx) => weights[name] = (weights[name] ?? 0) + (idx === 0 ? 2 : 1));
    });

    return Object.entries(weights)
        .sort(([, a], [, b]) => b - a)
        .map(([name, weight]) => ({ name, weight }));
};

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export async function fetchMadeForYou(history: { song: Song }[]): Promise<Song[]> {
    const SEARCH_API = process.env.NEXT_PUBLIC_SONG_SEARCH_PRIMARY_API_URL;
    if (!SEARCH_API) return [];

    const historyArtists = extractHistoryArtists(history);

    const fetchRawResults = async (url: string) => fetch(url).then(r => r.ok ? r.json() : []).then(extractResults).catch(() => []);
    const fetchArtistSongs = async (artist: string, pages = 3) => parseSongsDeduped(await fetchRawResults(`${SEARCH_API}${encodeURIComponent(artist)}&page=${Math.floor(Math.random() * pages) + 1}`));

    const allSuggestions: Song[] = [];
    const pickedNames = new Set<string>();
    const artistTally = new Map<string, number>();
    const albumTally = new Map<string, number>();

    const selectSongs = (pools: Song[][], getCap: (key: string) => number) => {
        let hasMore = true;

        for (let idx = 0; allSuggestions.length < TARGET_SONGS && hasMore; idx++) {
            hasMore = false;
            for (const pool of pools) {
                const song = pool[idx];
                if (!song || pickedNames.has(sanitizeName(song.name))) continue;
                hasMore = true;

                const artistKey = primaryArtistKey(song);
                if (artistKey && (artistTally.get(artistKey) ?? 0) >= getCap(artistKey)) {
                    continue;
                }

                const albumKey = getAlbumKey(song.name);
                const hasAlbum = !!albumKey && albumKey.length > MAX_ALBUM_KEY_LENGTH;
                if (hasAlbum && (albumTally.get(albumKey) ?? 0) >= 1) {
                    continue;
                }

                allSuggestions.push(song);
                pickedNames.add(sanitizeName(song.name));

                if (artistKey) artistTally.set(artistKey, (artistTally.get(artistKey) ?? 0) + 1);
                if (hasAlbum) albumTally.set(albumKey, (albumTally.get(albumKey) ?? 0) + 1);

                if (allSuggestions.length === TARGET_SONGS) {
                    return;
                }
            }
        }
    };

    if (historyArtists.length) {
        const seeds = historyArtists.slice(0, HISTORY_SEED_LIMIT);

        const pools = await Promise.all(seeds.map(a => fetchArtistSongs(a.name, 3)));
        const totalWeight = Math.max(1, seeds.reduce((sum, a) => sum + a.weight, 0));

        const caps = new Map(seeds.map(a => [
            a.name.toLowerCase(),
            Math.max(1, Math.min(ABSOLUTE_MAX_PER_ARTIST, Math.round((a.weight / totalWeight) * TARGET_SONGS)))
        ]));

        selectSongs(pools, key => caps.get(key) ?? 1);
        if (allSuggestions.length < TARGET_SONGS) selectSongs(pools, () => ABSOLUTE_MAX_PER_ARTIST);
    }

    if (allSuggestions.length < TARGET_SONGS) {
        const fallbackSeeds = shuffleArray([...ARTIST_BUCKETS]).slice(0, FALLBACK_SEED_LIMIT).map(b => b[Math.floor(Math.random() * b.length)]);

        const pools = await Promise.all(fallbackSeeds.map(a => fetchArtistSongs(a, 1)));
        selectSongs(pools, () => 2);
        if (allSuggestions.length < TARGET_SONGS) selectSongs(pools, () => ABSOLUTE_MAX_PER_ARTIST);
    }

    if (allSuggestions.length < TARGET_SONGS) {
        const raw = await fetchRawResults(`${SEARCH_API}hindi`);
        selectSongs([parseSongsDeduped(raw)], () => ABSOLUTE_MAX_PER_ARTIST);
    }

    return shuffleArray(allSuggestions);
}

export async function fetchNewReleases(retries = 3): Promise<Song[]> {
    const apiBase = process.env.SANVIA_BASE_API_URL || process.env.NEXT_PUBLIC_SANVIA_BASE_API_URL;
    if (!apiBase) {
        return [];
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const targetUrl = apiBase.includes('/api/proxy')
                ? `${process.env.SANVIA_BASE_API_URL}/new-releases`
                : `${apiBase}/new-releases`;

            const response = await fetch(targetUrl, {
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
                type: item.type || "song",
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
        return [];
    }

    const endpoint = `${PLAYLIST_BY_ID_API}${TRENDING_PLAYLIST_ID}&limit=${LIMIT}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        if (!data.success || !data.data || !Array.isArray(data.data.songs)) {
            return [];
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
        console.error(error);
        return [];
    }
}

export async function fetchViralSongs(): Promise<Song[]> {
    const LIMIT = 12;

    if (!PLAYLIST_BY_ID_API || !VIRAL_PLAYLIST_ID) {
        return [];
    }

    const endpoint = `${PLAYLIST_BY_ID_API}${VIRAL_PLAYLIST_ID}&limit=${LIMIT}`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) return [];

        const data = await response.json();
        if (!data.success || !data.data || !Array.isArray(data.data.songs)) {
            return [];
        }

        return data.data.songs.map((item: Song) => {
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

            return {
                id: item.id || "",
                name: item.name || "",
                primaryArtists,
                image,
                downloadUrl,
                streamingUrl: downloadUrl || "",
            } as Song;
        });

    } catch (error) {
        console.error("Failed to fetch Viral songs:", error);
        return [];
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

export async function fetchTopArtists(): Promise<Artist[]> {
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

        const decodedTitle = decodeHTMLEntities(songTitle);
        const decodedArtist = decodeHTMLEntities(primaryArtists || "Unknown Artist");

        const safeTitle = decodedTitle
            .replace(/["″]/g, "”")
            .replace(/[/\\?%*:|<>]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 150);

        const safeArtist = decodedArtist
            .replace(/["″]/g, "”")
            .replace(/[/\\?%*:|<>]/g, " ")
            .replace(/\s+/g, " ")
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