import { useEffect, useState, useRef, useMemo } from "react";
import { Song } from "@/lib/songs";
import AddSongsToQueue from "./AddSongsToQueue";
import OnboardingTooltipManager from "./OnboardingTooltipManager";

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

export default function AlbumAndRecommendationSongs({
    currentSong,
    isExpanded,
    isHeightExpanded,
    artistName,
    onSongSelect,
    draggedSongs,
    onSongDragged,
    recommendedSongs,
    albumSongs,
    setRecommendedSongs,
    setAlbumSongs,
}: {
    currentSong: Song | null;
    isExpanded: boolean;
    isHeightExpanded: boolean;
    artistName?: string;
    onSongSelect: (song: Song, source: "dragged" | "album" | "recommended") => void;
    draggedSongs: Song[];
    onSongDragged?: (song: Song) => void;
    recommendedSongs: Song[];
    albumSongs: Song[];
    setRecommendedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    setAlbumSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}) {
    const isArtistView = !currentSong?.downloadUrl && !!artistName;
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [contentType, setContentType] = useState<'album' | 'recommended' | 'artist' | null>(null);
    const fetchIdRef = useRef(0);

    // Second div's items
    useEffect(() => {
        if (!currentSong && !artistName?.trim()) {
            setRecommendedSongs([]);
            setAlbumSongs([]);
            setLoading(false);
            setContentType(null);
            return;
        }

        const controller = new AbortController();
        let isCancelled = false;
        const currentFetchId = ++fetchIdRef.current;

        const fetchRecommendedSongs = async () => {
            setLoading(true);

            const primarySearchAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_URL_PRIMARY;
            const fallbackSearchAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_URL_FALLBACK;
            const searchSongIdAPI = process.env.NEXT_PUBLIC_SEARCH_SONG_API_ID;
            const searchAlbumAPI = process.env.NEXT_PUBLIC_SEARCH_ALBUM_API_URL;

            try {
                const url = currentSong?.downloadUrl;
                let detectedType: "album" | "recommended" | "artist" | null = null;

                if (url?.includes("/album/")) {
                    detectedType = 'album';
                } else if (url?.includes("/song/")) {
                    detectedType = 'recommended';
                } else if (artistName?.trim()) {
                    detectedType = 'artist';
                }
                setContentType(detectedType);

                // 1. Album
                if (url?.includes("/album/")) {
                    const encodedUrl = encodeURIComponent(url);

                    setAlbumSongs([]);
                    setRecommendedSongs([]);

                    const res = await fetch(`${searchAlbumAPI}${encodedUrl}`, { signal: controller.signal });
                    if (currentFetchId !== fetchIdRef.current) return;
                    const data = await res.json();

                    if (!isCancelled) {
                        setAlbumSongs(data.success && Array.isArray(data.data?.songs) ? data.data.songs : []);
                        return;
                    }
                }

                // 2. Song
                else if (url?.includes("/song/")) {
                    setAlbumSongs([]);
                    setRecommendedSongs([]);
                    const res = await fetch(`${searchSongIdAPI}${currentSong?.id}`, { signal: controller.signal });
                    if (currentFetchId !== fetchIdRef.current) return;
                    const data: SongSuggestionResponse = await res.json();

                    if (!isCancelled && data.success && Array.isArray(data.data)) {
                        const song = data.data[0];
                        const originalArtists = song?.artists?.primary?.map(a => a.name) ?? [];
                        const language = song?.language;
                        const albumName = song?.album?.name;

                        if (originalArtists.length > 0) {
                            const page = Math.floor(Math.random() * 7);
                            let combinedResults: Song[] = [];

                            for (let i = 0; i < Math.min(originalArtists.length, 2) && combinedResults.length < 17; i++) {
                                const artistName = encodeURIComponent(originalArtists[i]);

                                let suggestionRes = await fetch(`${primarySearchAPI}${artistName}&limit=17&page=${page}`, { signal: controller.signal });

                                if (currentFetchId !== fetchIdRef.current) return;

                                let suggestionData: SongSearchResult = await suggestionRes.json();

                                if (!suggestionRes.ok || !suggestionData.success || !Array.isArray(suggestionData.data?.results || suggestionData.data.results.length === 0)) {
                                    console.warn("Primary API failed, switching to fallback...");
                                    suggestionRes = await fetch(`${fallbackSearchAPI}${artistName}&limit=17&page=${page}`, { signal: controller.signal });
                                    if (currentFetchId !== fetchIdRef.current) return;
                                    suggestionData = await suggestionRes.json();
                                }

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

                                setRecommendedSongs(weighted);
                            } else {
                                setRecommendedSongs([]);
                            }
                        }
                    } else {
                        setRecommendedSongs([]);
                    }
                }

                // 3. Fallback to Artist (Only if downloadUrl exists but is neither /song/ nor /album/)
                else if (artistName?.trim()) {
                    setAlbumSongs([]);
                    setRecommendedSongs([]);
                    const artists = artistName.split(",").map(a => a.trim());
                    let songs: Song[] = [];

                    for (const artist of artists) {
                        const page = Math.floor(Math.random() * 7);

                        let res = await fetch(
                            `${primarySearchAPI}${encodeURIComponent(artist)}&limit=17&page=${page}`,
                            { signal: controller.signal }
                        );

                        if (currentFetchId !== fetchIdRef.current) return;
                        let data = await res.json();

                        // If primary fails, fallback
                        if (!res.ok || !data.success || !Array.isArray(data.data?.results) || data.data.results.length === 0) {
                            console.warn(`Primary API failed for ${artist}, trying fallback...`);
                            res = await fetch(
                                `${fallbackSearchAPI}${encodeURIComponent(artist)}&limit=17&page=${page}`,
                                { signal: controller.signal }
                            );

                            if (currentFetchId !== fetchIdRef.current) return;
                            data = await res.json();
                        }

                        // If success, assign and break out
                        if (data.success && Array.isArray(data.data?.results) && data.data.results.length > 0) {
                            songs = data.data.results;
                            break;
                        }
                    }

                    if (!isCancelled) {
                        setRecommendedSongs(songs);
                    }
                }

                // Nothing valid
                else {
                    setAlbumSongs([]);
                    setRecommendedSongs([]);
                    setContentType(null);
                }

            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") return;
                console.error("Fetch error:", error);
                if (!isCancelled && currentFetchId === fetchIdRef.current) {
                    setRecommendedSongs([]);
                    setAlbumSongs([]);
                }
            } finally {
                if (!isCancelled && currentFetchId === fetchIdRef.current) {
                    setLoading(false);
                }
            }
        };

        fetchRecommendedSongs();

        return () => {
            isCancelled = true;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSong?.downloadUrl, artistName]);

    // Div's heading
    const getHeading = () => {
        const firstArtist = artistName?.split(",")[0]?.trim() || "";

        if (loading) {
            switch (contentType) {
                case 'album': return "Loading album songs...";
                case 'recommended': return "Loading recommended songs...";
                case 'artist': return `Loading ${firstArtist}'s songs...`;
            }
        }

        if (albumSongs.length > 0) return "Album Songs";
        if (recommendedSongs.length > 0) {
            return isArtistView ? `${firstArtist}'s Songs` : "Song Suggestions";
        }

        if (contentType === "album") return "No album songs found.";
        if (contentType === "recommended") return "No recommended songs found.";
        if (contentType === "artist") return `No songs found for ${firstArtist}.`;
    };

    // Update the values on scroll
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current;
            el.scrollTop = 0;
            setIsScrolled(false);
        }
    }, [recommendedSongs, albumSongs, loading, isExpanded]);

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

    const combinedSongs = useMemo(() => {
        const combined: { song: Song; source: "album" | "recommended" }[] = [];

        if (albumSongs.length > 0) {
            combined.push(...albumSongs.map(song => ({ song, source: "album" as const })));
        }
        if (recommendedSongs.length > 0) {
            combined.push(...recommendedSongs.map(song => ({ song, source: "recommended" as const })));
        }

        return combined;
    }, [albumSongs, recommendedSongs]);
    console.log("albumSongs: ", albumSongs);
    console.log("recommendedSongs: ", recommendedSongs);
    console.log("combinedSongs: ", combinedSongs);

    if (!combinedSongs || !isExpanded) return null;

    return (
        <div className="grid grid-flow-row justify-items-center md:w-[500px]">
            {isExpanded && (
                <div className="grid grid-flow-row justify-items-center md:w-[450px] md-range:h-[588px] md:h-[580px] sm-range:h-[568px] h-[523px]">
                    <div className="flex justify-center md:w-[400px] md-range:w-[400px] sm-range:w-[380px] w-[330px]">
                        <h1 className="font-Lato text-center my-2 border-b border-dashed select-none h-7 line-clamp-1 w-fit">{getHeading()}</h1>
                    </div>

                    {/* Scrollable Songs */}
                    <div ref={scrollRef} onScroll={handleScroll} className={`allow-scroll justify-items-center overflow-y-auto md:w-[450px] md-range:w-[400px] sm-range:w-[380px] w-[330px] scrollbar-hide rounded-lg ${isScrolled ? "transition-all md:duration-300 bg-gradient-to-b from-zinc-800 to-transparent" : ""} ${isHeightExpanded ? "md-range:h-[535px] md:h-[530px] sm-range:h-[525px] h-[475px]" : "md:h-[490px] hidden"}`}>
                        {combinedSongs.length > 0 &&
                            <OnboardingTooltipManager id="third-msg" isExpanded={isExpanded} />
                        }
                        <ul>
                            {loading ? (
                                Array.from({ length: 15 }).map((_, i) => (
                                    <li key={i} className="flex items-center gap-3 min-h-20 p-2 md:w-[400px] md-range:w-[370px] sm-range:w-[350px] w-[310px] animate-pulse bg-zinc-800 rounded-md border my-3 cursor-pointer transition-all hover:scale-105" >
                                        <div className="w-[75px] h-[60px] bg-zinc-700 rounded-md" />
                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="h-4 bg-zinc-700 rounded w-3/4" />
                                            <div className="h-3 bg-zinc-700 rounded w-1/2" />
                                        </div>
                                    </li>
                                ))
                            ) : (
                                combinedSongs.map(({ song, source }) => (
                                    <AddSongsToQueue key={song.id} song={song} isArtistView={isArtistView} onClick={() => onSongSelect(song, source)} onDragComplete={() => onSongDragged?.(song)} isDragged={draggedSongs.some((s) => s.id === song.id)} />
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};