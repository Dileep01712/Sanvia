import React, { useEffect, useState, useRef } from "react";
import { Artist, Song } from "./songs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { searchFromJioSaavn } from "./songs";


export default function SongSearch({
    query,
    onSongSelect
}: {
    query: string,
    onSongSelect: (song: Song, results: Song[]) => void;
}) {
    const [results, setResults] = useState<Song[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [headingText, setHeadingText] = useState("");
    const hasMoreRef = useRef(hasMore);
    const resultsRef = useRef<Song[]>(results);
    const pageRef = useRef(page);
    const [loadMoreClicked, setLoadMoreClicked] = useState(false);

    const trimmedQuery = query.trim();

    useEffect(() => {
        hasMoreRef.current = hasMore;
        resultsRef.current = results;
    }, [hasMore, results]);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // Heading Text
    useEffect(() => {
        if (!trimmedQuery) {
            setHeadingText("");
            return;
        } else {
            setHeadingText("Searching...");
        }

        if (!loading && results.length == 0 && resultsRef.current.length == 0) {
            setHeadingText(`No Results Found for "${trimmedQuery}"`);
        }

        if (results.length > 0 && resultsRef.current.length > 0) {
            setHeadingText("Search Results");
        }

    }, [results, loading, trimmedQuery]);

    // Fetch Songs
    const fetchSongs = React.useCallback(async (query: string, controller: AbortController, isLoadMore = false) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || (!isLoadMore && !hasMoreRef.current)) return;

        setLoading(true);

        try {
            const allResults: Song[] = [];
            const seenIds = new Set<string>();
            let currentPage = isLoadMore ? pageRef.current : 1;
            const limit = 23;
            const maxItems = 46;

            if (!isLoadMore) {
                setResults([]);
                setHasMore(true);
                setPage(1);
                hasMoreRef.current = true;
            }

            while (allResults.length < maxItems && hasMoreRef.current) {
                const searchAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_URL;
                const url1 = `${searchAPI}${encodeURIComponent(trimmedQuery)}&limit=${limit}&page=${currentPage}`;

                const [res1, backendResults] = await Promise.all([
                    fetch(url1, { signal: controller.signal }).then((r) => r.json()),
                    searchFromJioSaavn(trimmedQuery),
                ]);

                const frontend = Array.isArray(res1.data?.results) ? res1.data.results : [];
                const backend = Array.isArray(backendResults) ? backendResults : [];

                const combined = [...frontend, ...backend]
                    .filter(song => song && song.id && !seenIds.has(song.id))
                    .map(song => {
                        seenIds.add(song.id);
                        return {
                            ...song,
                            primaryArtists: song.primaryArtists || ""
                        };
                    });

                if (combined.length === 0) {
                    setHasMore(false);
                    hasMoreRef.current = false;
                    break;
                }

                allResults.push(...combined);
                currentPage++;

                if (combined.length < limit) {
                    setHasMore(false);
                    hasMoreRef.current = false;
                    break;
                }
            }

            setResults(prev => [...prev, ...allResults]);
            setPage(currentPage);
            setLoading(false);

        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            console.error("Search error:", error);
            setResults([]);
            setHasMore(false);
            hasMoreRef.current = false;
        }
    }, []);

    // Call Fetch Function
    useEffect(() => {
        const controller = new AbortController();
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setResults([]);
            setPage(1);
            setHasMore(true);
            hasMoreRef.current = true;
            return;
        }

        // reset flags
        setResults([]);
        setPage(1);
        setHasMore(true);
        hasMoreRef.current = true;

        fetchSongs(trimmedQuery, controller, false);

        return () => controller.abort();
    }, [query, fetchSongs]);

    // Load More Songs
    const handleLoadMore = () => {
        if (!trimmedQuery || results.length == 0 || resultsRef.current.length == 0) return;
        setLoadMoreClicked(true);
        fetchSongs(trimmedQuery, new AbortController(), true);
    };

    // Decode Title Text
    function decodeHTMLEntities(text: string) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    };

    // Reset loadMoreClicked
    useEffect(() => {
        setLoadMoreClicked(false);
    }, [trimmedQuery]);

    const itemCount = loading && trimmedQuery ? (loadMoreClicked ? 12 * 2 : 12) : 12;
    console.log("SearchSong => query:", query);
    return (
        <div className="md:p-6 p-2">
            <h2 className="w-full max-w-full break-words whitespace-normal overflow-hidden text-ellipsis text-xl font-Black-Marker text-white md:pb-5 pb-2 pl-1.5 select-none">{headingText}</h2>

            {/* Loading Skeleton */}
            {loading && trimmedQuery ? (
                <div className="grid md:grid-cols-6 grid-cols-2 md:gap-8 gap-4 px-2">
                    {Array.from({ length: itemCount }).map((_, index) => (
                        <div key={index} className="md:w-[212px] md:rounded-xl rounded-lg bg-zinc-800 cursor-pointer transition-all duration-300 ease-in-out md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-gray-400/40 pb-1">
                            <div className="md:h-52 h-48 bg-zinc-700 animate-pulse rounded-md"></div>
                            <div className="h-6 bg-zinc-700 rounded w-3/4 mx-auto animate-pulse my-1"></div>
                            <div className="h-6 bg-zinc-700 rounded w-3/4 mx-auto animate-pulse"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-6 grid-cols-2 md:gap-8 gap-4 px-2">
                    {results.map((song, index) => {
                        const primaryArtists = song.artists?.primary?.map((artist: Artist) => artist.name).join(", ") || song.primaryArtists || "";
                        const image = Array.isArray(song.image)
                            ? song.image.find(img => img.quality === '500x500')?.url
                            : song.image;

                        return (
                            <div key={`${song.id}-${index}`} onClick={() => { onSongSelect(song, results) }} className="md:w-[212px] md:rounded-xl rounded-lg transition-all duration-300 ease-in-out md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-gray-400/40 cursor-pointer group">
                                <div className="relative">
                                    <Image src={image} alt={song.name} width={212} height={180} className="object-cover rounded-lg pb-0.5 group-hover:brightness-75 transition-all duration-300 ease-in-out select-none md:min-h-[212px]min-h-[156px]" />
                                    <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 rounded-full opacity-0 group-hover:opacity-100 w-12 h-12 flex items-center justify-center transition-all duration-300 ease-in-out">
                                        <FontAwesomeIcon icon={faPlay} className="text-white h-6 w-6 relative left-0.5" />
                                    </button>
                                </div>
                                <h3 className="text-white text-sm font-Lato truncate px-2.5 text-center transition-all duration-300 ease-in-out">{decodeHTMLEntities(song.name)}</h3>
                                <p className="text-sm font-Lato text-gray-400 truncate p-2.5 pt-0 text-center transition-all duration-300 ease-in-out">{primaryArtists}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            <Button variant={"secondary"} onClick={handleLoadMore} disabled={!trimmedQuery || !hasMore || loading} className="flex mx-auto md:my-14 my-7 select-none h-10 font-Lato">{loading && trimmedQuery ? "Loading..." : "Load More"}
            </Button>

        </div>
    );
}
