"use client";

import { useCallback, useMemo } from "react";
import { Song } from "@/lib/songTypes";
import OnboardingTooltipManager from "../Tooltips/OnboardingTooltipManager";
import SectionHeading from "./components/SectionHeading";
import SongList from "./components/SongList";
import { usePlayerStore } from "@/store/usePlayerStore";

interface RelatedSongsProps {
    artistName?: string;
    onSongSelect: (song: Song, source: "queued" | "album" | "recommended") => void;
    onSongQueued?: (song: Song) => void;
}

export default function RelatedSongsView({
    artistName,
    onSongSelect,
    onSongQueued,
}: RelatedSongsProps) {
    const isLoading = usePlayerStore((state) => state.loading);
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

    const handleSongQueued = useCallback(
        (song: Song) => {
            onSongQueued?.(song)
        },
        [onSongQueued]
    );

    if (!combinedSongs.length && !isLoading) {
        return null;
    }

    return (
        <div className="grid grid-flow-row justify-items-center">
            <div className={`flex justify-center [@media(min-width:360px)_and_(max-width:420px)]:w-[clamp(0rem,73vw,24rem)] [@media(max-width:640px)]:w-80 sm:w-87 md:w-90 lg:w-105 ${isExpanded ? "my-4 w-80" : "mt-11 w-65"}`}>
                <h1 className="select-none truncate text-center font-display font-bold uppercase drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)]">
                    <SectionHeading artistName={artistName} />
                </h1>
            </div>

            <div className={`allow-scroll scrollbar-hide justify-items-center overflow-y-auto rounded-lg w-80 sm:w-95 md:w-100 lg:w-117.5
                ${isExpanded
                    ? "pb-1.5 sm:pb-1.5 md:pb-1 lg:pb-1 h-110.5 sm:h-110.5 md:h-131 lg:h-131"
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
                        onSongQueued={handleSongQueued}
                    />
                </ul>
            </div>
        </div>
    );
}