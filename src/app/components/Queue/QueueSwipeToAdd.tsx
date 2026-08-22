import { Song } from "@/lib/songTypes";
import QueueItem from "./QueueItem";

interface QueueSwipeToAddProps {
    song: Song;
    onClick: () => void;
    onDragComplete: () => void;
    isQueued: boolean;
    isCurrentSong?: boolean;
}

export default function QueueSwipeToAdd({
    song,
    onClick,
    onDragComplete,
    isQueued,
    isCurrentSong,
}: QueueSwipeToAddProps) {
    return (
        <QueueItem
            song={song}
            direction="left"
            onComplete={onDragComplete}
            onClick={onClick}
            isQueued={isQueued}
            isCurrentSong={isCurrentSong}
        />
    );
}