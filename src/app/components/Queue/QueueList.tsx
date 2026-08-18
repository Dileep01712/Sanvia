"use client";

import { useCallback } from "react";
import { Song } from "@/lib/songTypes";
import RemoveSongsFromQueue from "./QueueSwipeToRemove";
import OnboardingTooltipManager from "../Tooltips/OnboardingTooltipManager";
import { usePlayerStore } from "@/store/usePlayerStore";

interface QueuedSongsProps {
    draggedSongs: Song[];
    onSongSelect: (song: Song, source: "recommended" | "album" | "dragged") => void;
    setDraggedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

export default function QueuedSongs({
    draggedSongs,
    onSongSelect,
    setDraggedSongs,
}: QueuedSongsProps) {
    const isExpanded = usePlayerStore((state) => state.isExpanded);
    const currentSong = usePlayerStore((state) => state.currentSong);

    const handleSongSelect = useCallback(
        (song: Song) => {
            onSongSelect(song, "dragged");
        },
        [onSongSelect]
    );

    return (
        <div className="grid grid-flow-row justify-items-center h-130.75 sm:h-142 md:h-147 lg:h-146.25">
            <div className={`flex w-80 justify-center sm:w-95 md:w-100 lg:w-117.5 ${isExpanded ? "my-4" : "mt-11"}`}>
                <h1 className="select-none truncate text-center font-display font-bold uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    Next in Queue
                </h1>
            </div>

            <div className={`allow-scroll scrollbar-hide min-h-17.5 w-80 justify-items-center overflow-y-auto rounded-lg sm:w-95 md:w-100 lg:w-117.5
                ${isExpanded
                    ? "pb-6.5 sm:pb-2 md:pb-2 lg:pb-0 h-118.75 sm:h-131.25 md:h-133.75 lg:h-131.25"
                    : "hidden"
                }
            `}>
                {draggedSongs.length > 0 && (
                    <OnboardingTooltipManager id="swipe-to-remove-tip" />
                )}

                <ul>
                    {draggedSongs.map((song) => (
                        <RemoveSongsFromQueue
                            key={song.id}
                            song={song}
                            isCurrentSong={currentSong?.id === song.id}
                            onClick={() => handleSongSelect(song)}
                            setDraggedSongs={setDraggedSongs}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}