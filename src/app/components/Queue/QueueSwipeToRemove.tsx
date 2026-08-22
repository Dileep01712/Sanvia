import { Song } from "@/lib/songTypes";
import QueueItem from "./QueueItem";

interface QueueSwipeToRemoveProps {
    song: Song;
    isCurrentSong?: boolean;
    onClick: () => void;
    setQueuedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

export default function QueueSwipeToRemove({
    song,
    isCurrentSong,
    onClick,
    setQueuedSongs,
}: QueueSwipeToRemoveProps) {
    const handleComplete = () => {
        setQueuedSongs((prev) => prev.filter((s) => s.id !== song.id));
    };

    return (
        <QueueItem
            song={song}
            isCurrentSong={isCurrentSong}
            direction="right"
            onComplete={handleComplete}
            onClick={onClick}
        />
    );
}