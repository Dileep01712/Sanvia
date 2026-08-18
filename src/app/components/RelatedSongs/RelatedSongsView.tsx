"use client";

import { useCallback, useMemo } from "react";
import { Song } from "@/lib/songTypes";
import OnboardingTooltipManager from "../Tooltips/OnboardingTooltipManager";
import SectionHeading from "./components/SectionHeading";
import SongList from "./components/SongList";
import { usePlayerStore } from "@/store/usePlayerStore";

interface AlbumAndRecommendationSongsProps {
    artistName?: string;
    onSongSelect: (song: Song, source: "dragged" | "album" | "recommended") => void;
    onSongDragged?: (song: Song) => void;
}

export default function AlbumAndRecommendationSongs({
    artistName,
    onSongSelect,
    onSongDragged,
}: AlbumAndRecommendationSongsProps) {
    const loading = usePlayerStore((state) => state.loading);
    const isExpanded = usePlayerStore((state) => state.isExpanded);
    const recommendedSongs = usePlayerStore((state) => state.recommendedSongs);
    const albumSongs = usePlayerStore((state) => state.albumSongs);

    const combinedSongs = useMemo(() => {
        const combined: { song: Song; source: "album" | "recommended" }[] = [];
        if (albumSongs.length) {
            combined.push(...albumSongs.map(song => ({ song, source: "album" as const })));
        }

        if (recommendedSongs.length) {
            combined.push(...recommendedSongs.map(song => ({ song, source: "recommended" as const })));
        }

        return combined;
    }, [albumSongs, recommendedSongs]);

    const handleSongSelect = useCallback(
        (song: Song, source: "album" | "recommended") => {
            onSongSelect(song, source);
        },
        [onSongSelect]
    );

    const handleSongDragged = useCallback(
        (song: Song) => {
            onSongDragged?.(song)
        },
        [onSongDragged]
    );

    if (!combinedSongs.length && !loading) {
        return null;
    }

    return (
        <div className="grid grid-flow-row justify-items-center h-126 sm:h-142 md:h-147 lg:h-146.25">
            <div className={`flex justify-center w-80 sm:w-95 md:w-100 lg:w-117.5 ${isExpanded ? "my-4" : "mt-11"}`}>
                <h1 className="select-none truncate text-center font-display font-bold uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    <SectionHeading artistName={artistName} />
                </h1>
            </div>

            <div className={`allow-scroll scrollbar-hide justify-items-center overflow-y-auto rounded-lg w-80 sm:w-95 md:w-100 lg:w-117.5
                ${isExpanded
                    ? "pb-6.5 sm:pb-2 md:pb-2 lg:pb-0 h-118.75 sm:h-131.25 md:h-133.75 lg:h-131.25"
                    : "hidden"
                }
            `}>
                {combinedSongs.length > 0 && (
                    <OnboardingTooltipManager id="swipe-to-queue-tip" />
                )}

                <ul>
                    <SongList
                        combinedSongs={combinedSongs}
                        onSongSelect={handleSongSelect}
                        onSongDragged={handleSongDragged}
                    />
                </ul>
            </div>
        </div>
    );
}