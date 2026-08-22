import { Song } from "@/lib/songTypes";
import { usePlayerStore } from "@/store/usePlayerStore";

export function useQueue() {
    const queuedSongs = usePlayerStore((state) => state.queuedSongs);
    const setQueuedSongs = usePlayerStore((state) => state.setQueuedSongs);

    const addToQueue = (song: Song) => {
        setQueuedSongs(prev => prev.some(s => s.id === song.id) ? prev : [...prev, song]);
    };

    const removeFromQueue = (songId: string) => {
        setQueuedSongs(prev => prev.filter(s => s.id !== songId));
    };

    return { queuedSongs, setQueuedSongs, addToQueue, removeFromQueue };
}