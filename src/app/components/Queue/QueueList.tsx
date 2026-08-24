"use client";

import { useCallback } from "react";
import { Song } from "@/lib/songTypes";
import QueueSwipeToRemove from "./QueueSwipeToRemove";
import OnboardingTooltipManager from "../Tooltips/OnboardingTooltipManager";
import { usePlayerStore } from "@/store/usePlayerStore";

interface QueueListProps {
    queuedSongs: Song[];
    onSongSelect: (song: Song, source: "recommended" | "album" | "queued") => void;
    setQueuedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

export default function QueueList({
    queuedSongs,
    onSongSelect,
    setQueuedSongs,
}: QueueListProps) {
    const isExpanded = usePlayerStore((state) => state.isExpanded);
    const currentSong = usePlayerStore((state) => state.currentSong);

    const handleSongSelect = useCallback(
        (song: Song) => {
            onSongSelect(song, "queued");
        },
        [onSongSelect]
    );

    return (
        <div className="grid grid-flow-row justify-items-center">
            <div className={`flex justify-center [@media(min-width:360px)_and_(max-width:420px)]:w-[clamp(0rem,73vw,24rem)] [@media(max-width:640px)]:w-80 sm:w-87 md:w-90 lg:w-105 ${isExpanded ? "my-4 w-80" : "mt-11 w-65"}`}>
                <h1 className="select-none truncate text-center font-display font-bold uppercase drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)]">
                    Up Next
                </h1>
            </div>

            <div className={`allow-scroll scrollbar-hide min-h-17.5 w-80 justify-items-center overflow-y-auto rounded-lg sm:w-95 md:w-100 lg:w-117.5
                ${isExpanded
                    ? "pb-1.5 sm:pb-1.5 md:pb-1 lg:pb-1 h-110.5 sm:h-110.5 md:h-131 lg:h-131"
                    : "hidden"
                }
            `}>
                {queuedSongs.length > 0 && (
                    <OnboardingTooltipManager id="swipe-to-remove-tip" />
                )}

                <ul>
                    {queuedSongs.map((song) => (
                        <QueueSwipeToRemove
                            key={song.id}
                            song={song}
                            isCurrentSong={currentSong?.id === song.id}
                            onClick={() => handleSongSelect(song)}
                            setQueuedSongs={setQueuedSongs}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}