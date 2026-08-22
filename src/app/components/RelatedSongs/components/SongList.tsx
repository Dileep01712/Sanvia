import { memo, useMemo } from "react";
import QueueSwipeToAdd from "../../Queue/QueueSwipeToAdd";
import { Song } from "@/lib/songTypes";
import SongListSkeleton from "./SongListSkeleton";
import { usePlayerStore } from "@/store/usePlayerStore";

interface SongListProps {
    combinedSongs: { song: Song; source: "album" | "recommended" }[];
    onSongSelect: (song: Song, source: "album" | "recommended") => void;
    onSongQueued?: (song: Song) => void;
}

function SongList({
    combinedSongs,
    onSongSelect,
    onSongQueued,
}: SongListProps) {
    const isLoading = usePlayerStore((state) => state.loading);
    const currentSong = usePlayerStore((state) => state.currentSong);
    const queuedSongs = usePlayerStore((state) => state.queuedSongs);

    const filteredSongs = useMemo(
        () => combinedSongs.filter((entry) => entry && entry.song),
        [combinedSongs]
    );

    const queuedSongIds = useMemo(
        () => new Set(queuedSongs.map((s) => s.id)),
        [queuedSongs]
    );

    if (isLoading) {
        return <SongListSkeleton />;
    }

    return (
        <>
            {filteredSongs.map(({ song, source }) => (
                <QueueSwipeToAdd
                    key={song.id}
                    song={song}
                    onClick={() => onSongSelect(song, source)}
                    onDragComplete={() => onSongQueued?.(song)}
                    isQueued={queuedSongIds.has(song.id)}
                    isCurrentSong={currentSong?.id === song.id}
                />
            ))}
        </>
    );
}

export default memo(SongList);