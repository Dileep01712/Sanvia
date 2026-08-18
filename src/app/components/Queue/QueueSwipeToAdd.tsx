import QueueSongItem from "./QueueItem";
import { Song } from "@/lib/songTypes";

export default function AddSongsToQueue({
    song,
    onClick,
    onDragComplete,
    isDragged,
    isCurrentSong,
}: {
    song: Song;
    onClick: () => void;
    onDragComplete: () => void;
    isDragged: boolean;
    isCurrentSong?: boolean;
}) {
    return (
        <QueueSongItem
            song={song}
            direction="left"
            onComplete={onDragComplete}
            onClick={onClick}
            isHighlighted={isDragged}
            isCurrentSong={isCurrentSong}
        />
    );
}