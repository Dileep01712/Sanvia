import { Song } from "@/lib/songTypes";
import { extractArtistsFromSong } from "@/lib/helpers";

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
    signal: AbortSignal
): Promise<Song[]> {
    try {
        if (!historySongs.length) return [];

        const TARGET_TOTAL = 14;
        const artistCounts: Record<string, number> = {};
        for (const song of historySongs) {
            const artists = extractArtistsFromSong(song);
            for (const artist of artists) {
                if (artist) {
                    const trimmedArtist = artist.trim();
                    artistCounts[trimmedArtist] = (artistCounts[trimmedArtist] || 0) + 1;
                }
            }
        }

        const sortedArtists = Object.entries(artistCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        if (!sortedArtists.length) return [];

        const historyIds = new Set(historySongs.map(s => s.id));
        const historyNames = new Set(historySongs.map(s => s.name));
        const finalQueue: Song[] = [];
        const seenIds = new Set<string>();
        const seenNames = new Set<string>();

        const fetchUntilQuota = async (artist: string, quota: number, maxPages: number = 4) => {
            const validArtistSongs: Song[] = [];
            let page = 1;

            while (validArtistSongs.length < quota && page <= maxPages) {
                if (signal.aborted) break;

                const pageResults = await fetchPage(artist, page, 50, songSearchPrimaryApi, songSearchFallbackApi, signal);

                for (const song of pageResults) {
                    if (validArtistSongs.length >= quota) break;

                    if (historyIds.has(song.id) || seenIds.has(song.id)) continue;
                    if (historyNames.has(song.name) || seenNames.has(song.name)) continue;

                    seenIds.add(song.id);
                    seenNames.add(song.name);
                    validArtistSongs.push(song);
                }

                if (pageResults.length < 50) break;
                page++;
            }
            return validArtistSongs;
        };

        if (historySongs.length === 1) {
            const combinedQuery = sortedArtists.slice(0, 2).join(" ");
            const combinedSongs = await fetchUntilQuota(combinedQuery, TARGET_TOTAL, 2);
            finalQueue.push(...combinedSongs);

            if (finalQueue.length < TARGET_TOTAL && sortedArtists[0]) {
                const remainingNeeded = TARGET_TOTAL - finalQueue.length;
                const fallbackSongs = await fetchUntilQuota(sortedArtists[0], remainingNeeded, 2);
                finalQueue.push(...fallbackSongs);
            }
        } else {
            const topFrequentArtists = sortedArtists.slice(0, 2);

            const quota1 = topFrequentArtists.length > 1 ? Math.ceil(TARGET_TOTAL * 0.6) : TARGET_TOTAL;

            const artist1Songs = await fetchUntilQuota(topFrequentArtists[0], quota1, 5);
            finalQueue.push(...artist1Songs);

            if (topFrequentArtists.length > 1) {
                const quota2 = TARGET_TOTAL - finalQueue.length;

                const artist2Songs = await fetchUntilQuota(topFrequentArtists[1], quota2, 3);
                finalQueue.push(...artist2Songs);
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