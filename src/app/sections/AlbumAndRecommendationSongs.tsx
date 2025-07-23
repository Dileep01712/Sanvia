import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Song } from "@/lib/songs";

type SongSuggestionResponse = {
    success: boolean;
    data: Song[];
};

type SongSearchResult = {
    success: boolean;
    data: {
        results: Song[];
    };
};

export default function AlbumSongs({
    currentSong,
    isExpanded,
    isHeightExpanded,
    artistName,
    onSongSelect,
}: {
    currentSong: Song | null;
    isExpanded: boolean;
    isHeightExpanded: boolean;
    artistName?: string;
    onSongSelect: (song: Song, recommended: Song[]) => void;
}) {
    const isArtistView = !!artistName;
    const [recommended, setRecommended] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Second div's items
    useEffect(() => {
        if (!currentSong && !artistName?.trim()) {
            setRecommended([]);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let isCancelled = false;

        const fetchRecommendedSongs = async () => {
            setLoading(true);

            const searchSongAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_URL;
            const searchSongIdAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_ID;
            const searchAlbumAPI = process.env.NEXT_PUBLIC_SEARCH_ALBUM_API_URL;

            try {
                const url = currentSong?.downloadUrl || "";

                // 1. Album
                if (url.includes("/album/")) {
                    const encodedUrl = encodeURIComponent(url);
                    const res = await fetch(`${searchAlbumAPI}${encodedUrl}`, { signal: controller.signal });
                    const data = await res.json();

                    if (!isCancelled) {
                        setRecommended(data.success && Array.isArray(data.data?.songs) ? data.data.songs : []);
                    }
                }

                // 2. Song
                else if (url.includes("/song/")) {
                    const res = await fetch(`${searchSongIdAPI}${currentSong?.id}`, { signal: controller.signal });
                    const data: SongSuggestionResponse = await res.json();

                    if (!isCancelled && data.success && Array.isArray(data.data)) {
                        const song = data.data[0];
                        const originalArtists = song?.artists?.primary?.map(a => a.name) ?? [];
                        const language = song?.language;
                        const albumName = song?.album?.name;

                        if (originalArtists.length > 0) {
                            const page = Math.floor(Math.random() * 7);
                            let combinedResults: Song[] = [];

                            for (let i = 0; i < Math.min(originalArtists.length, 2); i++) {
                                const artistName = encodeURIComponent(originalArtists[i]);
                                const suggestionRes = await fetch(`${searchSongAPI}${artistName}&limit=17&page=${page}`, { signal: controller.signal });

                                const suggestionData: SongSearchResult = await suggestionRes.json();

                                if (suggestionData.success && Array.isArray(suggestionData.data?.results)) {
                                    combinedResults = combinedResults.concat(suggestionData.data.results);
                                }
                            }

                            if (combinedResults.length > 0) {
                                const uniqueResults = Array.from(new Map(combinedResults.map(s => [s.id, s])).values());

                                const weighted = uniqueResults
                                    .map((s: Song) => {
                                        let weight = 0;
                                        if (s.album?.name === albumName) weight += 3;
                                        if (s.language === language) weight += 2;

                                        const matchCount = s.artists?.primary?.filter((a) =>
                                            originalArtists.includes(a.name)
                                        ).length ?? 0;

                                        weight += matchCount * 3;

                                        return { ...s, _weight: weight };
                                    })
                                    .sort((a, b) => (b._weight ?? 0) - (a._weight ?? 0));

                                setRecommended(weighted);
                            } else {
                                setRecommended([]);
                            }
                        }
                    } else {
                        setRecommended([]);
                    }
                }

                // 3. Fallback to Artist (Only if downloadUrl exists but is neither /song/ nor /album/)
                else if (artistName?.trim()) {
                    const firstArtist = artistName.split(',')[0].trim();
                    const page = Math.floor(Math.random() * 7);
                    const res = await fetch(`${searchSongAPI}${encodeURIComponent(firstArtist)}&limit=17&page=${page}`, { signal: controller.signal });
                    const data = await res.json();

                    if (!isCancelled) {
                        setRecommended(data.success && Array.isArray(data.data?.results) ? data.data.results : []);
                    }
                }

                // Nothing valid
                else {
                    setRecommended([]);
                }

            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                console.error("Fetch error:", error);
                if (!isCancelled) setRecommended([]);
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchRecommendedSongs();

        return () => {
            isCancelled = true;
            controller.abort();
        };
    }, [currentSong, artistName]);

    // Decode Title Text
    function decodeHTMLEntities(text: string) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }

    // Second div's title
    const getHeading = () => {
        const firstArtist = artistName?.split(",")[0]?.trim() || "";
        const url = currentSong?.downloadUrl || "";

        if (loading) {
            if (url.includes("/song/")) {
                return "Loading recommended songs...";
            } else if (url.includes("/album/")) {
                return "Loading album songs...";
            } else if (isArtistView) {
                return `Loading ${firstArtist}'s songs...`;
            }

        } else if (!loading && recommended.length === 0) {
            if (url.includes("/song/")) {
                return "No recommended songs found.";
            } else if (url.includes("/album/")) {
                return "No album songs found.";
            } else if (isArtistView) {
                return `No songs found for ${firstArtist}.`;
            }

        } else {
            if (url.includes("/song/")) {
                return "Song Suggestions";
            } else if (url.includes("/album/")) {
                return "Album Songs";
            } else if (isArtistView) {
                return `${firstArtist}'s Songs`;
            }
        }
    };

    // Update the values on scroll
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current;
            el.scrollTop = 0;
            setIsScrolled(false);
        }
    }, [recommended, loading, isExpanded]);

    // Reset div scroll
    useEffect(() => {
        if (isHeightExpanded && scrollRef.current) {
            const el = scrollRef.current;
            el.scrollTop = 0;
            setIsScrolled(false);
        }
    }, [isHeightExpanded]);

    // Handle Div Scrollable
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setIsScrolled(el.scrollTop > 0);
    };

    // Reset Div Scroll
    useEffect(() => {
        if (isHeightExpanded && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [isHeightExpanded]);

    if (!isExpanded) return null;

    return (
        <div className="grid grid-flow-row justify-items-center w-[500px]">
            {isExpanded && (
                <div className="grid grid-flow-row justify-items-center w-[450px] h-[580px]">
                    <h1 className="font-semibold my-2 border-b border-dashed select-none h-7">{getHeading()}</h1>

                    {/* Scrollable Songs */}
                    <div ref={scrollRef} onScroll={handleScroll} className={`justify-items-center overflow-y-auto w-[450px] scrollbar-hide rounded-lg ${isScrolled ? "transition-all duration-300 bg-gradient-to-b from-zinc-800 to-transparent" : ""} ${isHeightExpanded ? "h-[530px]" : "h-[490px]"}`}>
                        <ul>
                            {/* skeleton */}
                            {loading ? (
                                Array.from({ length: 15 }).map((_, i) => (
                                    <li key={i} className="flex items-center gap-3 min-h-20 p-2 w-[400px] animate-pulse bg-zinc-800 rounded-md border my-2 cursor-pointer transition-all hover:scale-105">
                                        <div className="w-[90px] h-[70px] bg-zinc-700 rounded-md" />
                                        <div className="flex flex-col gap-2 w-full pl-4">
                                            <div className="h-4 bg-zinc-700 rounded w-3/4" />
                                            <div className="h-3 bg-zinc-700 rounded w-1/2" />
                                        </div>
                                    </li>
                                ))
                            ) : (
                                recommended.map((song) => {
                                    const image = typeof song.image === "string" ? song.image : Array.isArray(song.image) ? ((song.image as { url: string }[]).at(-1)?.url ?? "") : "";
                                    if (!image) return null;

                                    return (
                                        <li key={song.id} onClick={() => onSongSelect(song, recommended)} className="will-change-transform flex items-center gap-3 min-h-20 p-2 w-[400px] justify-center group hover:scale-105 transition-all duration-300 hover:bg-zinc-700 rounded-md cursor-pointer border my-3">
                                            <Image src={image} alt={"Picture"} width={60} height={60} className="object-cover rounded-md select-none" />
                                            <div className="flex flex-col space-y-1 overflow-hidden w-full">
                                                <h3 className="w-full line-clamp-2 leading-tight">{decodeHTMLEntities(song.name)}</h3>
                                                <p className="text-xs text-gray-400 truncate w-full">
                                                    {song.artists?.primary?.map((a) => a.name).join(", ") ?? ""}
                                                </p>
                                            </div>
                                        </li>
                                    )
                                })
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};