import { memo, useMemo } from "react";
import AddSongsToQueue from "../../Queue/QueueSwipeToAdd";
import { Song } from "@/lib/songTypes";
import LoadingSkeleton from "./SongListSkeleton";
import { usePlayerStore } from "@/store/usePlayerStore";

interface SongListProps {
    combinedSongs: { song: Song; source: "album" | "recommended" }[];
    onSongSelect: (song: Song, source: "album" | "recommended") => void;
    onSongDragged?: (song: Song) => void;
}

function SongList({
    combinedSongs,
    onSongSelect,
    onSongDragged,
}: SongListProps) {
    const loading = usePlayerStore((state) => state.loading);
    const currentSong = usePlayerStore((state) => state.currentSong);
    const draggedSongs = usePlayerStore((state) => state.draggedSongs);

    const filteredSongs = useMemo(
        () => combinedSongs.filter((entry) => entry && entry.song),
        [combinedSongs]
    );

    const draggedSongIds = useMemo(
        () => new Set(draggedSongs.map((s) => s.id)),
        [draggedSongs]
    );

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <>
            {filteredSongs.map(({ song, source }) => (
                <AddSongsToQueue
                    key={song.id}
                    song={song}
                    onClick={() => onSongSelect(song, source)}
                    onDragComplete={() => onSongDragged?.(song)}
                    isDragged={draggedSongIds.has(song.id)}
                    isCurrentSong={currentSong?.id === song.id}
                />
            ))}
        </>
    );
}

export default memo(SongList);