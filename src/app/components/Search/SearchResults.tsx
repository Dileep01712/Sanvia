import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import SkeletonCard from "@/app/components/Home/ui/SkeletonCard";
import SongCard from "@/app/components/Home/ui/SongCard";
import { Button } from "@/components/ui/button";
import { Artist, Song } from "@/lib/songTypes";
import { decodeHTMLEntities } from "@/lib/helpers";

const PAGE_SIZE = 24;
const MAX_VISIBLE_SKELETONS = PAGE_SIZE;

const SONG_SEARCH_PRIMARY_API = process.env.NEXT_PUBLIC_SONG_SEARCH_PRIMARY_API_URL;
const SONG_SEARCH_FALLBACK_API = process.env.NEXT_PUBLIC_SONG_SEARCH_FALLBACK_API_URL;

const AnimatedEllipsis: React.FC = () => {
    return (
        <span className="inline-flex gap-1 ml-1">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="inline-block text-white animate-[floatDot_1.2s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.15}s` }}
                >
                    .
                </span>
            ))}
        </span>
    );
};

interface SearchResultsProps {
    query: string;
    onSongSelect: (song: Song, results: Song[]) => void;
}

export default function SearchResults({
    query,
    onSongSelect
}: SearchResultsProps) {
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const sanitizedQuery = query.trim();
    const [results, setResults] = useState<Song[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const apiPageRef = useRef(1);
    const bufferRef = useRef<Song[]>([]);
    const displayedIdsRef = useRef<Set<string>>(new Set());

    const fetchPage = useCallback(
        async (
            searchQuery: string,
            pageNum: number,
            signal: AbortSignal
        ): Promise<{ songs: Song[], total: number | null }> => {
            if (!SONG_SEARCH_PRIMARY_API || !SONG_SEARCH_FALLBACK_API) {
                throw new Error("Search API URLs not configured");
            }

            const buildUrl = (base: string) => {
                const separator = base.includes('?') ? '' : '?';
                return `${base}${separator}${encodeURIComponent(searchQuery)}&limit=${PAGE_SIZE}&page=${pageNum}`;
            };

            try {
                let response = await fetch(buildUrl(SONG_SEARCH_PRIMARY_API), { signal });

                if (!response.ok) {
                    console.warn("Primary API failed, switching to fallback...");
                    response = await fetch(buildUrl(SONG_SEARCH_FALLBACK_API), { signal });
                }

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                const fetchedSongs = Array.isArray(data?.data?.results) ? data.data?.results : [];
                const total = data?.data?.total ?? null;

                return { songs: fetchedSongs, total };
            } catch (error) {
                if ((error as Error).name === 'AbortError') throw error;
                console.error("Fetch error:", error);
                throw new Error("Failed to fetch songs");
            }
        },
        []
    );

    const fetchNextPage = useCallback(async (isInitialLoad = false, currentQuery = sanitizedQuery) => {
        if (!currentQuery || (!hasMore && !isInitialLoad) || (isSearchLoading && !isInitialLoad)) return;

        setIsSearchLoading(true);
        setError(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            let currentBuffer = [...bufferRef.current];
            let currentApiPage = apiPageRef.current;
            let isApiExhausted = false;
            let fetchAttempts = 0;
            const MAX_ATTEMPTS = 3;

            while (currentBuffer.length < PAGE_SIZE && !isApiExhausted && fetchAttempts < MAX_ATTEMPTS) {
                fetchAttempts++;
                const { songs: newSongs, total } = await fetchPage(currentQuery, currentApiPage, controller.signal);
                if (controller.signal.aborted) return;

                const uniqueFromDisplay = newSongs.filter(song => !displayedIdsRef.current.has(song.id));

                const bufferIds = new Set(currentBuffer.map(s => s.id));
                const trulyUnique = uniqueFromDisplay.filter(song => !bufferIds.has(song.id));

                currentBuffer = [...currentBuffer, ...trulyUnique];
                currentApiPage++;

                if (newSongs.length === 0 || (total !== null && (currentApiPage - 1) * PAGE_SIZE >= total)) {
                    isApiExhausted = true;
                }
            }

            if (controller.signal.aborted) return;

            const songsToDisplay = currentBuffer.slice(0, PAGE_SIZE);
            const remainingBuffer = currentBuffer.slice(PAGE_SIZE);

            songsToDisplay.forEach(song => displayedIdsRef.current.add(song.id));

            setResults(prev => isInitialLoad ? songsToDisplay : [...prev, ...songsToDisplay]);
            bufferRef.current = remainingBuffer;
            apiPageRef.current = currentApiPage;

            if (remainingBuffer.length === 0 && isApiExhausted) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            if (!controller.signal.aborted) {
                console.error("Search error:", err);
                setError("Failed to load songs. Please try again.");
            }
        } finally {
            if (!controller.signal.aborted) setIsSearchLoading(false);
        }
    }, [sanitizedQuery, hasMore, isSearchLoading, setIsSearchLoading, fetchPage]);

    useEffect(() => {
        if (!sanitizedQuery) {
            setResults([]);
            setHasMore(true);
            setError(null);
            setIsSearchLoading(false);
            return;
        }

        setResults([]);
        setHasMore(true);
        setError(null);
        apiPageRef.current = 1;
        bufferRef.current = [];
        displayedIdsRef.current.clear();

        fetchNextPage(true, sanitizedQuery);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sanitizedQuery]);

    const handleLoadMore = () => {
        fetchNextPage(false, sanitizedQuery);
    };

    const dynamicHeadingText = useMemo(() => {
        if (error) {
            return <span className="text-red-400">{error}</span>;
        }

        if (isSearchLoading && results.length === 0) {
            return (
                <span className="animate-in fade-in duration-300">
                    Searching for &quot;{sanitizedQuery}&quot;
                    <AnimatedEllipsis />
                </span>
            );
        }

        if (results.length > 0) {
            return `Top results for "${sanitizedQuery}"`;
        }

        if (!isSearchLoading && results.length === 0) {
            return `We couldn't find anything for "${sanitizedQuery}"`;
        }

        return "";
    }, [sanitizedQuery, isSearchLoading, results.length, error]);

    if (!sanitizedQuery) {
        return (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center px-4 select-none animate-in fade-in duration-500">
                <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border-2 border-white/50">
                    <span className="text-6xl opacity-60 grayscale pb-2">🎧</span>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-semibold text-white/90 mb-2 tracking-wide">
                    Discover Your Vibe
                </h2>
                <p className="text-zinc-500 text-sm md:text-base text-center max-w-xs font-sans">
                    Search for songs, artists, or albums to instantly start streaming.
                </p>
            </div>
        );
    }

    const showInitialLoading = isSearchLoading && sanitizedQuery && results.length === 0;

    return (
        <div className="w-full md:px-6">
            <h2 className="mb-2 w-full wrap-break-word pl-2 font-display text-2xl font-bold text-white select-none md:my-5.5 md:text-4xl">
                {dynamicHeadingText}
            </h2>

            <div className={`grid w-full grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 p-2 gap-4 md:gap-6 lg:gap-10 
                ${results.length > 0 ? "" : "mb-20"}
            `}>
                {showInitialLoading ? (
                    Array.from({ length: MAX_VISIBLE_SKELETONS }).map((_, idx) => (
                        <SkeletonCard key={idx} />
                    ))
                ) : (
                    results.map((song) => {
                        const primaryArtists =
                            song.artists?.primary?.map((artist: Artist) => artist.name).join(", ") ||
                            song.primaryArtists ||
                            "";

                        const image = Array.isArray(song.image)
                            ? song.image.find(img => img.quality === '500x500')?.url
                            : song.image;

                        const normalizedSong: Song = {
                            ...song,
                            type: song.type || "song",
                            name: decodeHTMLEntities(song.name),
                            primaryArtists,
                            image: image || "",
                        };

                        return (
                            <SongCard
                                key={`${song.id}`}
                                song={normalizedSong}
                                onClick={() => onSongSelect(song, results)}
                            />
                        );
                    })
                )}
            </div>

            {results.length > 0 && (
                <Button
                    variant={"default"}
                    onClick={handleLoadMore}
                    disabled={!sanitizedQuery || !hasMore || isSearchLoading}
                    className="mx-auto my-20 flex h-10 w-fit cursor-pointer select-none items-center justify-center bg-zinc-800 px-6 font-sans font-normal text-white transition-colors hover:bg-zinc-700"
                >
                    {isSearchLoading && sanitizedQuery ? "Loading..." : "Load More"}
                </Button>
            )}
        </div>
    );
}
