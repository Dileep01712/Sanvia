import React, { useEffect, useState, useRef } from "react";
import { Artist, Song } from "./songs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { Button } from "@/components/ui/button";


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
    const scrollPositionRef = useRef<number>(0);
    const [loadMoreCount, setLoadMoreCount] = useState(1);

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
            setHeadingText(`No results found for "${trimmedQuery}"`);
        }

        if (results.length > 0 && resultsRef.current.length > 0) {
            setHeadingText("Search results");
        }

    }, [results, loading, trimmedQuery]);

    // Fetch Songs Hook
    const fetchSongs = React.useCallback(
        async (query: string, controller: AbortController, isLoadMore = false) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery || (!isLoadMore && !hasMoreRef.current)) return;

            setLoading(true);

            try {
                let allResults: Song[] = [];
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
                    const primarySearchAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_URL_PRIMARY;
                    const fallbackSearchAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_URL_FALLBACK;

                    let res = await fetch(
                        `${primarySearchAPI}${encodeURIComponent(trimmedQuery)}&limit=${limit}&page=${currentPage}`,
                        { signal: controller.signal }
                    );

                    if (!res.ok) {
                        console.warn("Primary API failed, switching to fallback...");
                        res = await fetch(
                            `${fallbackSearchAPI}${encodeURIComponent(trimmedQuery)}&limit=${limit}&page=${currentPage}`,
                            { signal: controller.signal }
                        );
                    }

                    const data = await res.json();

                    // ⚡ This API already gives a direct list of songs
                    const results: Song[] = Array.isArray(data.data?.results) ? data.data?.results : [];

                    console.log("Fetched page:", currentPage, "Results:", results);

                    if (results.length === 0) {
                        setHasMore(false);
                        hasMoreRef.current = false;
                        break;
                    }

                    // Deduplicate by song id
                    const uniqueResults = Array.from(
                        new Map(results.map((song: Song) => [song.id, song])).values()
                    );

                    allResults = [...allResults, ...uniqueResults];
                    currentPage++;

                    if (results.length < limit) {
                        setHasMore(false);
                        hasMoreRef.current = false;
                        break;
                    }
                }

                setResults((prev) => [...prev, ...allResults]);
                setPage(currentPage);
                setLoading(false);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                console.error("Search API error:", error);
                setResults([]);
                setHasMore(false);
                hasMoreRef.current = false;
            }
        },
        []
    );

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

        scrollPositionRef.current = window.scrollY;

        setLoadMoreClicked(true);

        setLoadMoreCount(prev => prev + 1);

        fetchSongs(trimmedQuery, new AbortController(), true);
    };

    useEffect(() => {
        if (loadMoreClicked) {
            window.scrollTo({
                top: scrollPositionRef.current,
                behavior: "instant"
            });
            setLoadMoreClicked(false);
        }
    }, [results, loadMoreClicked]);

    // Decode Title Text
    function decodeHTMLEntities(text: string) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    };

    // Reset loadMoreClicked
    useEffect(() => {
        setLoadMoreClicked(false);
        setLoadMoreCount(1);
    }, [trimmedQuery]);

    return (
        <div className="grid justify-evenly md:p-6 p-2">
            <h2 className="w-full max-w-full break-words whitespace-normal overflow-hidden text-ellipsis text-xl font-Black-Marker text-white md:pb-5 pb-2 pl-1.5 select-none">{headingText}</h2>

            {/* Loading Skeleton */}
            {loading && trimmedQuery ? (
                <div className="grid lg:gap-8 gap-4 lg:grid-cols-6 lg:grid-rows-2 lg-range:grid-cols-4 md:grid-cols-4 md-range:grid-cols-3 grid-cols-2 p-2">
                    {Array.from({ length: loadMoreCount * 46 }).map((_, index) => (
                        <div key={index} className="lg:w-[212px] lg-range:w-[212px] md:w-[212px] md-range:w-[212px] sm:w-[212px] sm-range:w-[212px] lg:rounded-xl rounded-lg bg-zinc-800 cursor-pointer transition-all duration-300 ease-in-out lg:hover:scale-105 lg:hover:shadow-lg lg:hover:shadow-gray-400/40 pb-1">
                            <div className="md:h-52 md-range:h-52 sm-range:h-[209px] h-[156px] bg-zinc-700 animate-pulse rounded-md mb-1"></div>
                            <div className="h-6 bg-zinc-700 rounded w-3/4 mx-auto animate-pulse mb-0.5"></div>
                            <div className="h-6 bg-zinc-700 rounded w-3/4 mx-auto animate-pulse"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid lg:gap-8 gap-4 lg:grid-cols-6 lg:grid-rows-2 lg-range:grid-cols-4 md:grid-cols-4 md-range:grid-cols-3 grid-cols-2 p-2">
                    {results.map((song, index) => {
                        const primaryArtists = song.artists?.primary?.map((artist: Artist) => artist.name).join(", ") || song.primaryArtists || "";

                        const image = Array.isArray(song.image)
                            ? song.image.find(img => img.quality === '500x500')?.url
                            : song.image;

                        return (
                            <div key={`${song.id}-${index}`} onClick={() => { onSongSelect(song, results) }} className="lg:w-[212px] lg-range:w-[212px] md:w-[212px] md-range:w-[212px] sm:w-[212px] sm-range:w-[212px] md:rounded-xl rounded-lg transition-all duration-300 ease-in-out md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-gray-400/40 cursor-pointer group">
                                <div className="relative">
                                    <Image src={image} alt={song.name} width={212} height={180} loading="lazy" className="object-cover rounded-lg pb-0.5 group-hover:brightness-75 transition-all duration-300 ease-in-out select-none md:min-h-[212px] min-h-[156px]" />
                                    <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 rounded-full opacity-0 group-hover:opacity-100 w-12 h-12 flex items-center justify-center transition-all duration-300 ease-in-out">
                                        <FontAwesomeIcon icon={faPlay} className="text-white h-6 w-6 relative left-0.5" />
                                    </button>
                                </div>
                                <h3 className="text-white text-sm font-Lato truncate px-2.5 text-center transition-all duration-300 ease-in-out mb-0.5">{decodeHTMLEntities(song.name)}</h3>
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
