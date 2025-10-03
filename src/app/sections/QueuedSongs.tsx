import { useEffect, useState, useRef } from "react";
import { Song } from "@/lib/songs";
import RemoveSongsFromQueue from "./RemoveSongsFromQueue";
import OnboardingTooltipManager from "./OnboardingTooltipManager";

export default function QueuedSongs({
    onSongSelect,
    isExpanded,
    isHeightExpanded,
    draggedSongs,
    setDraggedSongs,
}: {
    isExpanded: boolean;
    isHeightExpanded: boolean;
    draggedSongs: Song[];
    onSongSelect: (song: Song, source: "recommended" | "album" | "dragged") => void;
    setDraggedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}) {
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Update the values on scroll
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current;
            el.scrollTop = 0;
            setIsScrolled(false);
        }
    }, [isExpanded]);

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
        <div className="grid grid-flow-row justify-items-center md:w-[500px]">
            {isExpanded && (
                <div className="grid grid-flow-row justify-items-center md:w-[450px] md-range:h-[588px] md:h-[580px] sm-range:h-[568px] h-[523px]">
                    <h1 className="font-Lato my-2 border-b border-dashed select-none h-7">Next in Queue</h1>

                    {/* Scrollable Songs */}
                    <div ref={scrollRef} onScroll={handleScroll} className={`allow-scroll justify-items-center overflow-y-auto md:w-[450px] md-range:w-[400px] sm-range:w-[380px] w-[330px] scrollbar-hide rounded-lg ${isScrolled ? "transition-all md:duration-300 bg-gradient-to-b from-zinc-800 to-transparent" : ""} ${isHeightExpanded ? "md-range:h-[535px] md:h-[530px] sm-range:h-[525px] h-[475px]" : "md:h-[490px] hidden"}`}>
                        {draggedSongs.length > 0 &&
                            <OnboardingTooltipManager id="fourth-msg" isExpanded={isExpanded} />
                        }
                        <ul>
                            {draggedSongs.map((song) => (
                                <RemoveSongsFromQueue key={song.id} song={song} onClick={() => onSongSelect(song, "dragged")} setDraggedSongs={setDraggedSongs} />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};