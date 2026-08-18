import { Song } from "@/lib/songTypes";
import { usePlayerStore } from "@/store/usePlayerStore";

export function useQueue() {
    const draggedSongs = usePlayerStore((state) => state.draggedSongs);
    const setDraggedSongs = usePlayerStore((state) => state.setDraggedSongs);

    const addToQueue = (song: Song) => {
        setDraggedSongs(prev => prev.some(s => s.id === song.id) ? prev : [...prev, song]);
    };

    const removeFromQueue = (songId: string) => {
        setDraggedSongs(prev => prev.filter(s => s.id !== songId));
    };

    return { draggedSongs, setDraggedSongs, addToQueue, removeFromQueue };
}