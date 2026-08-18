import { Song } from "@/lib/songTypes";
import { extractArtistsFromSong, normalizeTitle } from "@/lib/helpers";

interface ScoredSong extends Song {
    relevanceScore: number;
}

function weightedRandomSample(items: ScoredSong[], count: number): ScoredSong[] {
    if (items.length === 0) return [];

    const remaining = [...items];
    const selected: ScoredSong[] = [];
    const finalCount = Math.min(count, items.length);

    while (selected.length < finalCount && remaining.length > 0) {
        const totalWeight = remaining.reduce((sum, s) => sum + s.relevanceScore ** 2, 0);

        if (totalWeight === 0) {
            const randomIndex = Math.floor(Math.random() * remaining.length);
            selected.push(remaining.splice(randomIndex, 1)[0]);
            continue;
        }

        let rand = Math.random() * totalWeight;
        for (let i = 0; i < remaining.length; i++) {
            rand -= remaining[i].relevanceScore ** 2;
            if (rand <= 0) {
                selected.push(remaining.splice(i, 1)[0]);
                break;
            }
        }
    }

    return selected;
}

async function fetchPage(
    query: string,
    page: number,
    limit: number,
    songSearchPrimaryApi: string,
    songSearchFallbackApi: string,
    signal: AbortSignal
): Promise<Song[]> {
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

export async function getSmartRecommendations(
    currentSong: Song,
    songSearchPrimaryApi: string,
    songSearchFallbackApi: string,
    signal: AbortSignal
): Promise<Song[]> {
    try {
        const allArtists = extractArtistsFromSong(currentSong);
        if (!allArtists.length) return [];

        const currentNormalizedTitle = normalizeTitle(currentSong.name);
        const allResults: Song[] = [];

        const seenIds = new Set<string>([currentSong.id]);

        const addUniqueSongs = (songs: Song[]) => {
            for (const s of songs) {
                if (!seenIds.has(s.id)) {
                    seenIds.add(s.id);
                    allResults.push(s);
                }
            }
        };

        if (currentSong.album?.name) {
            try {
                const res = await fetch(
                    `${songSearchPrimaryApi}${encodeURIComponent(currentSong.album.name)}&limit=50`,
                    { signal }
                );

                const data = await res.json();
                if (data.success && Array.isArray(data.data?.songs)) {
                    addUniqueSongs(data.data.songs);
                }
            } catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError")) {
                    console.warn("Failed to fetch album context for recommendations", error);
                }
            }
        }

        const queries: string[] = [
            `${currentSong.name} ${allArtists[0]}`,
            currentSong.album?.name ? `${currentSong.album.name} ${allArtists[0]}` : null,
            ...allArtists.slice(0, 3),
        ].filter(Boolean) as string[];

        const TARGET_UNIQUE = 40;

        for (const q of queries) {
            if (signal.aborted || seenIds.size >= TARGET_UNIQUE) break;

            let page = 1;
            while (page <= 3) {
                const pageResults = await fetchPage(q, page, 30, songSearchPrimaryApi, songSearchFallbackApi, signal);
                addUniqueSongs(pageResults);

                if (seenIds.size >= TARGET_UNIQUE || pageResults.length < 30) break;
                page++;
            }
        }

        const scoredPrelim: ScoredSong[] = allResults.map(song => {
            let score = 0;
            const songArtists = extractArtistsFromSong(song);

            score += songArtists.filter(a => allArtists.includes(a)).length * 15;
            if (currentSong.album?.name && song.album?.name === currentSong.album.name) score += 50;
            if (song.language && currentSong.language && song.language === currentSong.language) score += 5;
            const tWords = song.name.toLowerCase().split(/\s+/);
            const cWords = currentSong.name.toLowerCase().split(/\s+/);
            score += tWords.filter(w => cWords.includes(w)).length * 2;

            return { ...song, relevanceScore: score };
        });

        const titleMap = new Map<string, ScoredSong>();

        for (const s of scoredPrelim) {
            const norm = normalizeTitle(s.name);
            if (norm === currentNormalizedTitle) continue;

            const existing = titleMap.get(norm);
            if (!existing || s.relevanceScore > existing.relevanceScore) {
                titleMap.set(norm, s);
            }
        }

        let filtered = Array.from(titleMap.values());
        const MIN_SCORE = 5;
        filtered = filtered.filter(s => s.relevanceScore >= MIN_SCORE);

        if (filtered.length < 14 && !signal.aborted) {
            for (const artist of allArtists.slice(0, 2)) {
                if (filtered.length >= 14 || signal.aborted) break;

                for (let page = 1; page <= 2; page++) {
                    const fallbackResults = await fetchPage(artist, page, 50, songSearchPrimaryApi, songSearchFallbackApi, signal);

                    for (const s of fallbackResults) {
                        if (s.id === currentSong.id) continue;

                        const norm = normalizeTitle(s.name);
                        if (norm === currentNormalizedTitle) continue;

                        const sArtists = extractArtistsFromSong(s);
                        const artistOverlap = sArtists.filter(a => allArtists.includes(a)).length;
                        const score = (artistOverlap * 10) + (s.language === currentSong.language ? 5 : 0);

                        if (score >= MIN_SCORE) {
                            const existing = titleMap.get(norm);
                            if (!existing || score > existing.relevanceScore) {
                                titleMap.set(norm, { ...s, relevanceScore: score });
                            }
                        }
                    }

                    if (titleMap.size >= 20) break;
                }
            }

            filtered = Array.from(titleMap.values())
                .filter(s => s.relevanceScore >= MIN_SCORE)
                .sort((a, b) => b.relevanceScore - a.relevanceScore);
        }

        const poolSize = Math.min(50, filtered.length);
        const pool = filtered.slice(0, poolSize);

        return weightedRandomSample(pool, 14);

    } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
            console.error("Smart Recommendation engine failed:", error);
        }
        return [];
    }
}