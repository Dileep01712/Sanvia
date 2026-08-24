import { Song } from "@/lib/songTypes";
import { extractArtistsFromSong, extractExtendedArtistsFromSong } from "@/lib/helpers";

async function fetchPage(
    query: string,
    page: number,
    limit: number,
    songSearchPrimaryApi: string,
    songSearchFallbackApi: string,
    signal: AbortSignal
): Promise<Song[]> {
    if (!query) return [];

    const encoded = encodeURIComponent(query);
    let res = await fetch(`${songSearchPrimaryApi}${encoded}&limit=${limit}&page=${page}`, { signal });
    let data = await res.json();

    if (!res.ok || !data.success || !Array.isArray(data.data?.results)) {
        res = await fetch(`${songSearchFallbackApi}${encoded}&limit=${limit}&page=${page}`, { signal });
        data = await res.json();
    }

    if (data.success && Array.isArray(data.data?.results)) {
        return data.data.results;
    }

    return [];
}

export async function generateRecommendations(
    historySongs: Song[],
    songSearchPrimaryApi: string,
    songSearchFallbackApi: string,
    signal: AbortSignal,
    albumByLinkApi: string
): Promise<Song[]> {
    try {
        if (!historySongs.length) return [];

        const TARGET_TOTAL = 14;
        const CURRENT_SONG_WEIGHT = 10;
        const currentSong = historySongs[historySongs.length - 1];

        const artistCounts: Record<string, number> = {};
        historySongs.forEach((song, idx) => {
            const weight = idx === historySongs.length - 1 ? CURRENT_SONG_WEIGHT : 1;
            for (const artist of extractArtistsFromSong(song)) {
                if (artist) artistCounts[artist.trim()] = (artistCounts[artist.trim()] || 0) + weight;
            }
        });

        const sortedArtists = Object.entries(artistCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        const historyIds = new Set(historySongs.map(s => s.id));
        const historyNames = new Set(historySongs.map(s => s.name));
        const finalQueue: Song[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();

        const isRelevantMatch = (song: Song, queryArtist: string) => {
            const q = queryArtist.toLowerCase().trim();
            return extractArtistsFromSong(song).some(a => {
                const name = a.toLowerCase().trim();
                return name.includes(q) || q.includes(name);
            });
        };

        const fetchUntilQuota = async (artist: string, quota: number, maxPages = 4, validate = true) => {
            const valid: Song[] = [];
            let page = 1;
            while (valid.length < quota && page <= maxPages) {
                if (signal.aborted) break;
                const pageResults = await fetchPage(artist, page, 50, songSearchPrimaryApi, songSearchFallbackApi, signal);
                for (const song of pageResults) {
                    if (valid.length >= quota) break;
                    if (historyIds.has(song.id) || seenIds.has(song.id)) continue;
                    if (historyNames.has(song.name) || seenNames.has(song.name)) continue;
                    if (validate && !isRelevantMatch(song, artist)) continue;
                    seenIds.add(song.id);
                    seenNames.add(song.name);
                    valid.push(song);
                }
                if (pageResults.length < 50) break;
                page++;
            }
            return valid;
        };

        if (historySongs.length === 1) {
            const combinedQuery = sortedArtists.slice(0, 2).join(" ");
            finalQueue.push(...await fetchUntilQuota(combinedQuery, TARGET_TOTAL, 2, false));
            if (finalQueue.length < TARGET_TOTAL && sortedArtists[0]) {
                finalQueue.push(...await fetchUntilQuota(sortedArtists[0], TARGET_TOTAL - finalQueue.length, 2, false));
            }
        } else {
            const top2 = sortedArtists.slice(0, 2);
            const quota1 = top2.length > 1 ? Math.ceil(TARGET_TOTAL * 0.6) : TARGET_TOTAL;
            finalQueue.push(...await fetchUntilQuota(top2[0], quota1, 5));
            if (top2.length > 1 && finalQueue.length < TARGET_TOTAL) {
                finalQueue.push(...await fetchUntilQuota(top2[1], TARGET_TOTAL - finalQueue.length, 3));
            }
        }

        if (finalQueue.length < TARGET_TOTAL) {
            const extended = extractExtendedArtistsFromSong(currentSong)
                .filter(a => !sortedArtists.slice(0, 2).includes(a));
            for (const artist of extended) {
                if (finalQueue.length >= TARGET_TOTAL) break;
                finalQueue.push(...await fetchUntilQuota(artist, TARGET_TOTAL - finalQueue.length, 2));
            }
        }

        if (finalQueue.length < TARGET_TOTAL) {
            const albumUrl = (currentSong.album as { url?: string } | undefined)?.url;
            if (albumUrl && albumByLinkApi) {
                try {
                    const res = await fetch(`${albumByLinkApi}${encodeURIComponent(albumUrl)}`, { signal });
                    const data = await res.json();
                    let albumSongs: Song[] = [];
                    if (data.success && data.data) {
                        if (Array.isArray(data.data.songs)) albumSongs = data.data.songs;
                        else if (Array.isArray(data.data.results)) albumSongs = data.data.results;
                        else if (Array.isArray(data.data)) albumSongs = data.data;
                    }
                    for (const song of albumSongs) {
                        if (finalQueue.length >= TARGET_TOTAL) break;
                        if (historyIds.has(song.id) || seenIds.has(song.id)) continue;
                        if (historyNames.has(song.name) || seenNames.has(song.name)) continue;
                        seenIds.add(song.id);
                        seenNames.add(song.name);
                        finalQueue.push(song);
                    }
                } catch { /* best-effort, ignore */ }
            }
        }

        return finalQueue.sort(() => 0.5 - Math.random());

    } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
            console.error("Smart Recommendation engine failed:", error);
        }
        return [];
    }
}