import { Song } from "@/lib/songTypes";
import QueueSongItem from "./QueueItem";

export default function RemoveSongsFromQueue({
    song,
    isCurrentSong,
    onClick,
    setDraggedSongs,
}: {
    song: Song;
    isCurrentSong?: boolean;
    onClick: () => void;
    setDraggedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}) {
    const handleComplete = () => {
        setDraggedSongs((prev) => prev.filter((s) => s.id !== song.id));
    };

    return (
        <QueueSongItem
            song={song}
            isCurrentSong={isCurrentSong}
            direction="right"
            onComplete={handleComplete}
            onClick={onClick}
        />
    );
}