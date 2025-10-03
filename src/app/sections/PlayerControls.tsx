import { useState, useCallback, useRef } from "react";
import { Song, downloadSong } from '@/lib/songs';

export default function PlayerControls() {
    const manualTypeRef = useRef<"dragged" | "album" | "recommended" | null>(null);
    const [sourceType, setSourceType] = useState<"recommended" | "dragged" | "album">("recommended");
    const [, setIsPlaying] = useState(true);
    const [streamingUrl, setStreamingUrl] = useState<string>("");
    const [, setDuration] = useState(0);
    const [, setCurrentTime] = useState(0);
    const [draggedSongs, setDraggedSongs] = useState<Song[]>([]);
    const [draggedIndex, setDraggedIndex] = useState(0);

    const finalSourceType: "dragged" | "album" | "recommended" = manualTypeRef.current ?? sourceType;

    /**
         * Moves to the next song.
         * If shuffle is enabled, selects a random valid song that’s not the current one.
         * Otherwise, moves to the next song in order.
         * Pauses audio if at the end of the playlist in normal mode.
         */
    const next = useCallback(() => {
        // reset small UI playback state
        setIsPlaying(false);
        setStreamingUrl("");
        setCurrentTime(0);
        setDuration(0);

        // choose source by priority
        let source: Song[] = [];
        let currentIdx = 0;
        let setIndexFn: (n: number) => void = () => { };

        if (finalSourceType === "dragged" && draggedSongs.length > 0) {
            console.log("next() => draggedIndex: ", draggedIndex);
            source = draggedSongs;
            currentIdx = draggedIndex;
            setIndexFn = (n: number) => setDraggedIndex(n);
        } else if (finalSourceType === "album" && albumSongs.length > 0) {
            console.log("next() => albumIndex: ", albumIndex);
            source = albumSongs;
            currentIdx = albumIndex;
            setIndexFn = (n: number) => setAlbumIndex(n);
        } else {
            console.log("next() => playlistIndex: ", playlistIndex);
            source = playlist;
            currentIdx = playlistIndex;
            setIndexFn = (n: number) => setPlaylistIndex(n);
        }

        if (!source || source.length === 0) return;

        // --- compute a stable "active id" to locate current index (avoid race)
        const activeId = lastSongId ?? currentSong?.id ?? selectedSong?.id ?? null;
        const actualPrev = activeId ? source.findIndex(s => s.id === activeId) : -1;
        const isSwitchingSource = actualPrev === -1;
        console.log("activeId: ", activeId);
        console.log("actualPrev: ", actualPrev);
        console.log("isSwitchingSource: ", isSwitchingSource);

        // --- NEW SPECIAL CASE: if we're using draggedSongs and the current song is the last item,
        // next should come from albumSongs[0] if available, else playlist[0].
        if (finalSourceType === "dragged" && actualPrev === source.length - 1) {
            if (albumSongs.length > 0) {
                setDraggedSongs([]);
                setManualSource("album");
                setAlbumIndex(0);
                setSelectedSong(albumSongs[0]);
                setLastSongId(albumSongs[0]?.id ?? null);
                return;
            }

            if (recommendedSongs.length > 0) {
                setAlbumSongs([]);
                setManualSource("recommended");
                setPlaylistIndex(0);
                setSelectedSong(recommendedSongs[0]);
                setLastSongId(playlist[0]?.id ?? null);
                return;
            }
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }
        // --- end special case

        // --- NEW SPECIAL CASE 2: if we're using albumSongs and the current song is the last item,
        // clear albumSongs and jump to recommendedSongs[0]
        if (finalSourceType === "album" && actualPrev === source.length - 1) {
            if (recommendedSongs.length > 0) {
                setAlbumSongs([]);
                setAlbumIndex(-1);
                setManualSource("recommended");
                setPlaylistIndex(0);
                setSelectedSong(recommendedSongs[0]);
                setLastSongId(recommendedSongs[0]?.id ?? null);
                return;
            }
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }
        // --- end special case 2

        // determine shuffle state (support pendingShuffle)
        let shouldShuffle = isShuffle;
        if (pendingShuffle) {
            setIsShuffle(true);
            setPendingShuffle(false);
            shouldShuffle = true;
        }

        const pickRandomPlayableIndex = (excludeIndex: number | null) => {
            const playableIndexes = source
                .map((s, i) => (s.downloadUrl ? i : -1))
                .filter(i => i >= 0);
            if (playableIndexes.length === 0) return -1;
            if (playableIndexes.length === 1) return playableIndexes[0];
            let attempts = 0;
            while (attempts < 12) {
                const choice = playableIndexes[Math.floor(Math.random() * playableIndexes.length)];
                if (excludeIndex === null || choice !== excludeIndex) return choice;
                attempts++;
            }
            for (const i of playableIndexes) if (i !== excludeIndex) return i;
            return playableIndexes[0];
        };

        // If switching sources and shuffle is OFF => start at first playable
        if (isSwitchingSource && !shouldShuffle) {
            let idx0 = 0;
            while (idx0 < source.length && !source[idx0]?.downloadUrl) idx0++;
            if (idx0 >= source.length) {
                audioRef.current?.pause();
                setIsPlaying(false);
                return;
            }
            setManualSource(finalSourceType);
            setIndexFn(idx0);
            setLastSongId(source[idx0]?.id ?? null);
            return;
        }

        // If switching sources and shuffle is ON => pick random playable
        if (isSwitchingSource && shouldShuffle) {
            const randIdx = pickRandomPlayableIndex(null);
            if (randIdx === -1) {
                audioRef.current?.pause();
                setIsPlaying(false);
                return;
            }
            setManualSource(finalSourceType);
            setIndexFn(randIdx);
            setLastSongId(source[randIdx]?.id ?? null);
            return;
        }

        // continuing inside same source: actualPrev is valid
        currentIdx = actualPrev;

        // only one playable song? stay there
        const playableCount = source.filter(s => s.downloadUrl).length;
        if (playableCount <= 1) {
            setManualSource(finalSourceType);
            setIndexFn(currentIdx);
            setLastSongId(source[currentIdx]?.id ?? null);
            return;
        }

        // if shuffle -> pick random not-equal-to-current
        if (shouldShuffle) {
            const randIdx = pickRandomPlayableIndex(currentIdx);
            if (randIdx !== -1) {
                setManualSource(finalSourceType);
                setIndexFn(randIdx);
                setLastSongId(source[randIdx]?.id ?? null);
                return;
            }
        }

        // normal next -> find next playable after currentIdx
        let nextIndex = currentIdx + 1;
        while (nextIndex < source.length && !source[nextIndex]?.downloadUrl) nextIndex++;

        if (nextIndex < source.length) {
            setManualSource(finalSourceType);
            setIndexFn(nextIndex);
            setLastSongId(source[nextIndex]?.id ?? null);
            return;
        }

        // reached end -> wrap to start only if draggedSongs exist
        if (draggedSongs.length > 0) {
            let idx0 = 0;
            while (idx0 < source.length && !source[idx0]?.downloadUrl) idx0++;
            if (idx0 < source.length) {
                setManualSource(finalSourceType);
                setIndexFn(idx0);
                setLastSongId(source[idx0]?.id ?? null);
                return;
            }
        }

        // otherwise stop
        audioRef.current?.pause();
        setIsPlaying(false);
    }, [
        draggedSongs,
        albumSongs,
        playlist,
        draggedIndex,
        albumIndex,
        playlistIndex,
        setLastSongId,
        lastSongId,
        currentSong,
        selectedSong,
        isShuffle,
        pendingShuffle,
        audioRef,
        finalSourceType,
        recommendedSongs,
        setManualSource,
    ]);
    console.log("sourceType:", sourceType, "finalSourceType:", finalSourceType, "array length:", playbackSource.length, "draggedIndex:", draggedIndex, "albumIndex:", albumIndex, "playlistIndex:", playlistIndex, "lastSongId:", lastSongId, "draggedSongs: ", draggedSongs);


    /**
     * Moves to the previous song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the previous song in circular order.
     */
    const prev = () => {
        setIsPlaying(false);
        setStreamingUrl("");
        setCurrentTime(0);
        setDuration(0);

        const isQueueAvailable = draggedSongs.length > 0;
        const source = isQueueAvailable ? draggedSongs : playlist;

        if (isQueueAvailable && sourceType !== "dragged") {
            setSourceType("dragged");
        }

        if (!selectedItem || currentIndex < 0 || source.length === 0) return;

        if (isShuffle) {
            let randomIndex = currentIndex;
            while (source.length > 1 && (!source[randomIndex]?.downloadUrl || randomIndex === currentIndex)) {
                randomIndex = Math.floor(Math.random() * source.length);
            }
            setCurrentIndex(randomIndex);
        } else {
            let prevIndex = currentIndex - 1;
            while (prevIndex >= 0 && !source[prevIndex]?.downloadUrl) {
                prevIndex--;
            }

            if (prevIndex < 0 && isQueueAvailable) {
                prevIndex = source.length - 1;
            }

            setCurrentIndex(prevIndex >= 0 ? prevIndex : currentIndex);
        }
    };

    /**
     * Toggles shuffle mode.
     * If already on, turns it off.
     * If off, marks shuffle as pending (applied on next song).
     */
    const shuffle = () => {
        if (isShuffle || pendingShuffle) {
            setIsShuffle(false);
            setPendingShuffle(false);
        } else {
            setPendingShuffle(true);
        }
    };

    /**
     * Replays the current song from the start.
     */
    const repeat = () => {
        setIsRepeat((prev) => !prev);
    };

    // Song Download
    const handleDownload = async () => {
        if (!streamingUrl) return;
        setIsDownloading(true);
        setDownloadProgress(0);
        await downloadSong(streamingUrl, name, (percent) => {
            setDownloadProgress(percent);
        });
        setIsDownloading(false);
    };

    return (
        <div></div>
    )
}