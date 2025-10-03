"use client";


import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Song, Album, Artist, downloadSong } from '@/lib/songs';
import { getStreamingUrlFromSaavn } from '@/lib/getStreamingUrl';
import AlbumAndRecommendationSongs from "./AlbumAndRecommendationSongs";
import QueuedSongs from './QueuedSongs';
import { Button } from '@/components/ui/button';
import OnboardingTooltipManager from './OnboardingTooltipManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faForwardStep,
    faBackwardStep,
    faPause,
    faRepeat,
    faShuffle,
    faVolumeHigh,
    faVolumeXmark,
    faDownload,
    faAngleDown,
    faAngleUp,
    faSpinner,
    faX
} from '@fortawesome/free-solid-svg-icons';

type ModalItem = Song | Album | Artist;

interface NowPlayingModalProps {
    isOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isExpanded: boolean;
    setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    selectedItem: ModalItem | null;
    playlist: Song[];
    topArtists: Artist[];
    onArtistChange: (artist: Artist) => void;
    setPlaylist: React.Dispatch<React.SetStateAction<Song[]>>;
    artistHelper: boolean;
}

export default function NowPlayingModal({
    isOpen,
    setIsModalOpen,
    isExpanded,
    setIsExpanded,
    selectedItem,
    playlist,
    topArtists,
    onArtistChange,
    setPlaylist,
    artistHelper,
}: NowPlayingModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState(0);
    const [albumIndex, setAlbumIndex] = useState(0);
    const [recommendedIndex, setRecommendedIndex] = useState<number>(0);
    const [playlistIndex, setPlaylistIndex] = useState(0);

    const [isPlaying, setIsPlaying] = useState(true);
    const [streamingUrl, setStreamingUrl] = useState<string>("");
    const [overriddenTitle, setOverriddenTitle] = useState<string | null>(null);
    const [overriddenArtist, setOverriddenArtist] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isTimeoutOver, setIsTimeoutOver] = useState(false);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragProgress, setDragProgress] = useState<number | null>(null);
    const [isShuffle, setIsShuffle] = useState(false);
    const [pendingShuffle, setPendingShuffle] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const hasLoadedRef = useRef<string | null>(null);
    const volumeBarRef = useRef<HTMLDivElement | null>(null);
    const previousVolumeRef = useRef<number>(1);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isVolumeDragging, setIsVolumeDragging] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const [isHeightExpanded, setIsHeightExpanded] = useState(false);
    const [activePage, setActivePage] = useState(0);
    const [isRounded, setIsRounded] = useState(false);

    const [lastSongId, _setLastSongId] = useState<string | null>(null);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);

    const [sourceType, setSourceType] = useState<"dragged" | "album" | "recommended" | "playlist">("playlist");
    const manualTypeRef = useRef<"dragged" | "album" | "recommended" | "playlist" | null>(null);
    const finalSourceType: "dragged" | "album" | "recommended" | "playlist" = manualTypeRef.current ?? sourceType;

    const [draggedSongs, setDraggedSongs] = useState<Song[]>([]);
    const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
    const [albumSongs, setAlbumSongs] = useState<Song[]>([]);
    let currentSong: Song | null = null;

    const boxRef = useRef<HTMLDivElement | null>(null);
    const [selectionSource, setSelectionSource] = useState<"user" | "navigation">("user");
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    // Check the screen size
    useEffect(() => {
        const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
        checkScreen(); // initial
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    const playbackSource = useMemo(() => {
        if (finalSourceType === "dragged") return draggedSongs;
        if (finalSourceType === "album") return albumSongs;
        if (finalSourceType === "recommended") return recommendedSongs;
        if (finalSourceType === "playlist") return playlist;
    }, [finalSourceType, draggedSongs, albumSongs, recommendedSongs, playlist]);

    const setManualSource = useCallback(
        (t: "dragged" | "album" | "recommended" | "playlist" | null) => {
            manualTypeRef.current = t;
            setSourceType(t ?? sourceType);
        }, [sourceType]);

    const setLastSongId = useCallback((id: string | null) => {
        if (id && /[A-Za-z]/.test(id)) {
            _setLastSongId(id);
        }
    }, []);

    let isArtistView = selectedItem ? isArtist(selectedItem) : false;
    let currentArtist = isArtistView ? (selectedItem as Artist) : null;
    if (currentSong !== null) {
        isArtistView = false;
        currentArtist = null;
    }

    // Decode Title Text
    function decodeHTMLEntities(text: string) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    };

    // current Song
    currentSong = useMemo(() => {
        const buildSongObject = (song: Song) => {
            const selectedImage = Array.isArray(song.image)
                ? song.image.find((img) => img.quality === '500x500')?.url || ""
                : typeof song.image === 'string'
                    ? song.image
                    : "";

            const downloadUrl = Array.isArray(song.downloadUrl)
                ? song.downloadUrl.find((d: { quality: string, url: string }) => d.quality === '320kbps')?.url || ""
                : song.downloadUrl || "";

            const streamingUrl = Array.isArray(song.downloadUrl)
                ? song.downloadUrl.find((d: { quality: string, url: string }) => d.quality === '320kbps')?.url || ""
                : song.streamingUrl || "";

            return {
                id: song.id,
                name: decodeHTMLEntities(song.name),
                primaryArtists: song.artists?.primary?.map((a) => a.name).join(", ") || song.primaryArtists || "",
                image: selectedImage,
                downloadUrl,
                streamingUrl,
            };
        };

        let source: Song[] = [];
        let index = 0;

        if (finalSourceType === "dragged") {
            source = draggedSongs;
            index = draggedIndex;
        } else if (finalSourceType === "album") {
            source = albumSongs;
            index = albumIndex;
        } else if (finalSourceType === "recommended") {
            source = recommendedSongs;
            index = recommendedIndex;
        } else {
            source = playlist;
            index = playlistIndex;
        }

        // Priority 1: Use playlist context if available
        if (source.length > 0 && index >= 0 && index < source.length) {
            return buildSongObject(source[index]);
        }

        // Priority 2: Use selectedSong if available
        if (selectedSong) {
            return buildSongObject(selectedSong);
        }

        return null;
    }, [
        draggedSongs,
        albumSongs,
        recommendedSongs,
        playlist,
        draggedIndex,
        albumIndex,
        recommendedIndex,
        playlistIndex,
        selectedSong,
        finalSourceType
    ]);
    console.log("currentSong: ", currentSong);

    /**
     * Sets the current index when a new item is passed to the modal.
     * Finds the item in the playlist and sets it as the current song.
     */
    useEffect(() => {
        if (!selectedItem || selectionSource === "navigation") return;

        const draggedIdx = draggedSongs.findIndex(s => s.id === selectedItem?.id);
        if (draggedIdx !== -1) {
            setDraggedIndex(draggedIdx);
            return;
        }

        const albumIdx = albumSongs.findIndex(s => s.id === selectedItem?.id);
        if (albumIdx !== -1) {
            setAlbumIndex(albumIdx);
            return;
        }

        const recommendedIdx = recommendedSongs.findIndex(s => s.id === selectedItem?.id);
        if (recommendedIdx !== -1) {
            setRecommendedIndex(recommendedIdx);
            return;
        }

        const playlistIdx = playlist.findIndex(s => s.id === selectedItem?.id);
        if (playlistIdx !== -1) {
            setPlaylistIndex(playlistIdx);
            return;
        }

        console.log("draggedIdx: ", draggedIdx);
        console.log("albumIdx: ", albumIdx);
        console.log("recommendedIdx: ", recommendedIdx);
        console.log("playlistIdx: ", playlistIdx);
    }, [selectedItem, draggedSongs, albumSongs, recommendedSongs, playlist, selectionSource]);

    /**
     * Fetches and sets the streaming URL for the current song when it changes
     * Only triggers if the image is loaded to ensure smoother playback experience.
     */
    useEffect(() => {
        if (!currentSong || (!currentSong.streamingUrl && !currentSong.downloadUrl) || (!isImageLoaded && !isArtist(selectedItem))) {
            setStreamingUrl("");
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
                setIsPlaying(false);
            }
            return;
        }

        setIsPlaying(false);

        if (currentSong.streamingUrl) {
            hasLoadedRef.current = currentSong.id;
            setStreamingUrl(currentSong.streamingUrl);
            setOverriddenTitle(null);
            setOverriddenArtist(null);
            setLastSongId(currentSong.id);
            return;
        }

        hasLoadedRef.current = currentSong.id;
        setLastSongId(currentSong.id);

        const controller = new AbortController();
        const signal = controller.signal;

        const loadStream = async () => {
            try {
                const { url, name, primaryArtists } = await getStreamingUrlFromSaavn(
                    currentSong.id,
                    currentSong.name,
                    currentSong.downloadUrl
                );

                if (!signal.aborted) {
                    if (selectedItem && "downloadUrl" in selectedItem) {
                        setStreamingUrl(url);
                        setIsPlaying(true);
                    } else {
                        setStreamingUrl("");
                        setIsPlaying(false);
                    }

                    if (currentSong.downloadUrl.includes("/album/")) {
                        setOverriddenTitle(name);
                        setOverriddenArtist(primaryArtists);
                    } else {
                        setOverriddenTitle(null);
                        setOverriddenArtist(null);
                    }
                }
            } catch (error) {
                if (!signal.aborted) {
                    console.error("Stream fetch error: ", error);
                    setStreamingUrl("");
                }
            }
        };

        loadStream();

        return () => {
            controller.abort();
        };
    }, [currentSong, setLastSongId, isImageLoaded, selectedItem]);

    /**
     * Moves to the next song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the next song in order.
     * Pauses audio if at the end of the playlist in normal mode.
     */
    const next = useCallback(() => {
        setSelectionSource("navigation");

        // reset small UI playback state
        setStreamingUrl("");
        setIsPlaying(false);
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
            setIndexFn = setDraggedIndex;

        } else if (finalSourceType === "album" && albumSongs.length > 0) {
            console.log("next() => albumIndex: ", albumIndex);
            source = albumSongs;
            currentIdx = albumIndex;
            setIndexFn = setAlbumIndex;

        } else if (finalSourceType === "recommended" && recommendedSongs.length > 0) {
            console.log("next() => recommendedIndex: ", recommendedIndex);
            source = recommendedSongs;
            currentIdx = recommendedIndex;
            setIndexFn = setRecommendedIndex;

        } else {
            console.log("next() => playlistIndex: ", playlistIndex);
            source = playlist;
            currentIdx = playlistIndex;
            setIndexFn = setPlaylistIndex;
        }

        if (!source || source.length === 0) {
            setTimeout(() => setSelectionSource("user"), 100);
            return;
        }

        // 2. HANDLE SHUFFLE MODE
        let shouldShuffle = isShuffle;
        if (pendingShuffle) {
            setIsShuffle(true);
            setPendingShuffle(false);
            shouldShuffle = true;
        }

        if (shouldShuffle) {
            const playableIndexes = source
                .map((s, i) => (s.downloadUrl ? i : -1))
                .filter(i => i >= 0 && i !== currentIdx);

            if (playableIndexes.length > 0) {
                const randomIndex = playableIndexes[Math.floor(Math.random() * playableIndexes.length)];
                setManualSource(finalSourceType);
                setIndexFn(randomIndex);
                setLastSongId(source[randomIndex]?.id ?? null);
                setTimeout(() => setSelectionSource("user"), 100);
                return;
            }
        }

        // normal next -> find next playable after currentIdx
        let nextIndex = currentIdx + 1;
        while (nextIndex < source.length && !source[nextIndex]?.downloadUrl) {
            nextIndex++;
        }
        console.log("nextIndex: ", nextIndex);
        console.log("finalSourceType: ", finalSourceType);

        if (nextIndex < source.length) {
            setManualSource(finalSourceType);
            setIndexFn(nextIndex);
            setLastSongId(source[nextIndex]?.id ?? null);
            setTimeout(() => setSelectionSource("user"), 100);
            return;
        }

        // PRIORITY 1: Dragged Songs (Highest)
        if (draggedSongs.length > 0) {
            console.log("🔊 → Moving to Dragged Songs");
            setManualSource("dragged");
            setDraggedIndex(0);
            setLastSongId(draggedSongs[0]?.id ?? null);
            setTimeout(() => setSelectionSource("user"), 100);
            return;
        }

        // PRIORITY 2: Album Songs (Medium)
        if (albumSongs.length > 0) {
            console.log("🔊 → Moving to Album Songs");
            setManualSource("album");
            setAlbumIndex(0);
            setLastSongId(albumSongs[0]?.id ?? null);
            setTimeout(() => setSelectionSource("user"), 100);
            return;
        }

        // PRIORITY 3: Recommended Songs (Low)
        if (recommendedSongs.length > 0) {
            console.log("🔊 → Moving to Recommended Songs");
            setManualSource("recommended");
            setRecommendedIndex(0);
            setLastSongId(recommendedSongs[0]?.id ?? null);
            setTimeout(() => setSelectionSource("user"), 100);
            return;
        }

        // PRIORITY 4: Wrap Current Source (Playlist/Dragged only)
        if (finalSourceType === "playlist" || finalSourceType === "dragged") {
            let wrapIndex = 0;
            while (wrapIndex < source.length && !source[wrapIndex]?.downloadUrl) {
                wrapIndex++;
            }
            if (wrapIndex < source.length) {
                console.log("🔊 → Wrapping to start of", finalSourceType);
                setManualSource(finalSourceType);
                setIndexFn(wrapIndex);
                setLastSongId(source[wrapIndex]?.id ?? null);
                setTimeout(() => setSelectionSource("user"), 100);
                return;
            }
        }


        // otherwise stop
        audioRef.current?.pause();
        setIsPlaying(false);
        setTimeout(() => setSelectionSource("user"), 100);
    }, [
        draggedSongs,
        albumSongs,
        recommendedSongs,
        playlist,

        draggedIndex,
        albumIndex,
        recommendedIndex,
        playlistIndex,

        setLastSongId,
        isShuffle,
        pendingShuffle,
        audioRef,
        finalSourceType,
        setManualSource,
    ]);
    console.log("sourceType:", sourceType, "finalSourceType:", finalSourceType, "array length:", playbackSource?.length, "draggedIndex:", draggedIndex, "albumIndex:", albumIndex, "playlistIndex:", playlistIndex, "lastSongId:", lastSongId, "draggedSongs: ", draggedSongs);
    console.log("playlist: ", playlist);

    useEffect(() => {
        console.log("🎵 CURRENT STATE:", {
            finalSourceType,
            currentIndex: finalSourceType === "dragged" ? draggedIndex :
                finalSourceType === "album" ? albumIndex :
                    finalSourceType === "recommended" ? recommendedIndex : playlistIndex,
            currentSongId: currentSong?.id,
            lastSongId,
            sourceLength: playbackSource?.length
        });
    }, [lastSongId, playbackSource?.length, currentSong, finalSourceType, draggedIndex, albumIndex, recommendedIndex, playlistIndex]);

    /**
     * Moves to the previous song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the previous song in circular order.
     */
    const prev = () => {
        setStreamingUrl("");
        setIsPlaying(false);
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

    /**
     * Controls the audio element:
     * - Loads the new stream if the URL has changed.
     * - Plays audio when stream is ready and image is loaded.
     * - Handles play/pause/end events to update state and move to next song.
     */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            if (isRepeat && audio) {
                audio.currentTime = 0;
                audio.play();
            } else {
                next();
            }
        };

        if (!streamingUrl || !isImageLoaded) {
            if (audio.src) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
                setIsPlaying(false);
            }
        } else {
            if (audio.src !== streamingUrl) {
                audio.pause();
                audio.src = streamingUrl;
                audio.load();

                audio.oncanplay = () => {
                    audio.play()
                        .then(() => setIsPlaying(true))
                        .catch(console.error);
                };
            }
        }

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);

            if (isArtist(selectedItem) && audio.src) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
                setIsPlaying(false);
            }
        };
    }, [streamingUrl, isImageLoaded, next, isRepeat, isOpen, selectedItem]);

    /**
     * Toggles audio playback manually (via play/pause button).
     */
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(console.error);
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    /**
     * Converts seconds into a MM:SS format string.
     */
    function formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }

    /**
     * Shows fallback skeleton loader for 12 seconds while image loads.
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsTimeoutOver(true);
        }, 12000);
        return () => clearTimeout(timer);
    }, []);

    /**
     * Locks the body scroll when modal is open.
     */
    useLayoutEffect(() => {
        if (isOpen && isExpanded) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen, isExpanded]);

    /**
     * Starts seeking audio position when user clicks down on the progress bar.
     */
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        updateCurrentTimeFromMouse(e);
    };

    /**
     * Updates currentTime and progress as user drags along the progress bar.
     */
    const updateCurrentTimeFromMouse = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!audioRef.current || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        setDragProgress(percentage);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration]);

    /**
     * Updates currentTime and progress as user touch along the progress bar.
     */
    const updateCurrentTimeFromTouch = useCallback((clientX: number) => {
        if (!audioRef.current || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const percentage = x / rect.width;
        const newTime = percentage * duration;

        setDragProgress(percentage);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration]);

    /**
     * Listens to mouse events on the progress bar during dragging and updates time accordingly.
     */
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            updateCurrentTimeFromMouse(e);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDragProgress(null);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                updateCurrentTimeFromTouch(e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
            setDragProgress(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mouseleave", handleMouseUp);

        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleEnd);
        window.addEventListener("touchcancel", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mouseleave", handleMouseUp);

            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
            window.removeEventListener("touchcancel", handleEnd);
        };
    }, [isDragging, updateCurrentTimeFromMouse, updateCurrentTimeFromTouch]);

    useEffect(() => {
        setOverriddenTitle(null);
        setOverriddenArtist(null);
    }, [selectedItem]);

    // Check Artist
    function isArtist(item: ModalItem | null): item is Artist {
        return !!item && typeof item === "object" && "follower_count" in item;
    }

    // Clear Current Audio
    useEffect(() => {
        if (!selectedItem || !("downloadUrl" in selectedItem)) {
            setStreamingUrl("");
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
            }
        }
    }, [selectedItem]);

    // Get Artist
    useEffect(() => {
        if (selectedItem && isArtist(selectedItem) && topArtists.length > 0) {
            const index = topArtists.findIndex((artist) => artist.id === selectedItem?.id);
            if (index !== -1 && index !== currentIndex) {
                setCurrentIndex(index);
            } else if (index === -1) {
                console.warn(`Artist ${selectedItem.name} not found in topArtists`);
            }
        }
    }, [selectedItem, topArtists, currentIndex]);

    // Previous Artist
    const prevArtist = () => {
        if (!isArtistView || topArtists.length === 0 || currentIndex === -1) return;
        const newIndex = (currentIndex - 1 + topArtists.length) % topArtists.length;
        setCurrentIndex(newIndex);
        onArtistChange(topArtists[newIndex]);
    };

    // Next Artist
    const nextArtist = () => {
        if (!isArtistView || topArtists.length === 0) return;
        setCurrentIndex(prev => {
            if (prev === -1) {
                onArtistChange(topArtists[0]);
                return 0;
            }
            const newIndex = (prev + 1) % topArtists.length;
            onArtistChange(topArtists[newIndex]);
            return newIndex;
        });
    };

    // Update Voulme Progress Bar
    const updateVolumeByClientX = (clientX: number) => {
        if (!volumeBarRef.current || !audioRef.current) return;

        const rect = volumeBarRef.current.getBoundingClientRect();
        let newVolume = (clientX - rect.left) / rect.width;
        newVolume = Math.min(1, Math.max(0, newVolume));

        audioRef.current.volume = newVolume;
        setVolume(newVolume);

        if (newVolume === 0) {
            setIsMuted(true);
        } else {
            previousVolumeRef.current = newVolume;
            setIsMuted(false);
        }
    };

    const handleVolumeBarClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        updateVolumeByClientX(e.clientX);
    };

    // Voulme Toggle
    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMuted || volume === 0) {
            const restoreVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 1;
            audio.volume = restoreVolume;
            setVolume(restoreVolume);
            setIsMuted(false);
        } else {
            previousVolumeRef.current = volume;
            audio.volume = 0;
            setVolume(0);
            setIsMuted(true);
        }
    };

    const handleVolumeMouseDown = () => {
        setIsVolumeDragging(true);
    };

    const handleVolumeTouchStart = () => {
        setIsVolumeDragging(true);
    };

    // Voulme Dragging
    useEffect(() => {
        const handleVolumeMouseMove = (e: MouseEvent) => {
            if (isVolumeDragging) {
                updateVolumeByClientX(e.clientX);
            }
        };

        const handleVolumeMouseUp = () => {
            if (isVolumeDragging) {
                setIsVolumeDragging(false);
            }
        };

        const handleVolumeTouchMove = (e: TouchEvent) => {
            if (isVolumeDragging && e.touches.length > 0) {
                updateVolumeByClientX(e.touches[0].clientX);
            }
        };

        const handleVolumeTouchEnd = () => {
            if (isVolumeDragging) {
                setIsVolumeDragging(false);
            }
        };

        window.addEventListener("mousemove", handleVolumeMouseMove);
        window.addEventListener("mouseup", handleVolumeMouseUp);

        window.addEventListener("touchmove", handleVolumeTouchMove);
        window.addEventListener("touchend", handleVolumeTouchEnd);

        return () => {
            window.removeEventListener("mousemove", handleVolumeMouseMove);
            window.removeEventListener("mouseup", handleVolumeMouseUp);
            window.removeEventListener("touchmove", handleVolumeTouchMove);
            window.removeEventListener("touchend", handleVolumeTouchEnd);
        };
    }, [isVolumeDragging]);

    useEffect(() => {
        setIsHeightExpanded(isExpanded ? true : false);
    }, [isExpanded]);

    // Song Select
    const handleSongSelect = (song: Song, source: "dragged" | "album" | "recommended") => {
        console.log("source: ", source);

        manualTypeRef.current = source;

        if (source === "dragged") {
            const idx = draggedSongs.findIndex(s => s.id === song.id);
            console.log("draggedSongs => idx: ", idx);
            setSourceType("dragged");
            setLastSongId(song.id);
            setDraggedIndex(idx === -1 ? 0 : idx);

        } else if (source === "album") {
            const idx = albumSongs.findIndex(s => s.id === song.id);
            console.log("albumSongs => idx: ", idx);
            setSourceType("album");
            setLastSongId(song.id);
            setAlbumIndex(idx === -1 ? 0 : idx);

        } else {
            const idx = recommendedSongs.findIndex(s => s.id === song.id);
            console.log("recommendedSongs => idx: ", idx);
            setSourceType("recommended");
            setLastSongId(song.id);
            setPlaylistIndex(idx === -1 ? 0 : idx);
        }

        console.log("handleSongSelect => song: ", song);
        setSelectedSong(song);
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

    // Image Double Click
    const handleDoubleClick = () => {
        setIsRounded(prev => !prev);
    };

    const image = currentSong?.image ?? currentArtist?.image ?? "";
    const name = currentSong?.name ?? currentArtist?.name ?? currentSong?.primaryArtists ?? "";
    const fanCount = currentArtist?.follower_count
        ? Number(currentArtist.follower_count).toLocaleString()
        : null;

    // Chrome's media overlay 
    useEffect(() => {
        if (typeof window === "undefined" || !currentSong || !currentSong.name) return;

        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: overriddenTitle || currentSong.name,
                artist: overriddenArtist || currentSong.primaryArtists,
                artwork: [
                    {
                        src: currentSong.image,
                        sizes: "500x500",
                        type: "image/png",
                    },
                ],
            });

            // Optional: Add media control handlers (like play/pause)
            navigator.mediaSession.setActionHandler("play", () => {
                audioRef.current?.play();
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                audioRef.current?.pause();
            });
        }
    }, [currentSong, overriddenTitle, overriddenArtist]);

    // Close Modal
    const handleCloseModal = () => {
        // Reset all player states
        setIsPlaying(false);
        setCurrentIndex(-1);
        setStreamingUrl("");
        setCurrentTime(0);
        setDuration(0);

        // Clear song sources
        setDraggedSongs([]);
        setAlbumSongs([]);
        setRecommendedSongs([]);
        setPlaylist([]);
        setSelectedSong(null);
        setSourceType("playlist");

        setDraggedIndex(0);
        setAlbumIndex(0);
        setRecommendedIndex(0);
        setPlaylistIndex(0);
        setLastSongId(null);

        // Reset UI states
        setIsExpanded(true);
        setIsModalOpen(false);
        setIsImageLoaded(false);
        setIsRepeat(false);
        setPendingShuffle(false);

        // 🧹 Properly stop and clear audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.removeAttribute("src");
            audioRef.current.load();
        }

        // 🧹 Clear Media Session metadata
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: "",
                artist: "",
                artwork: []
            });

            navigator.mediaSession.setActionHandler("play", null);
            navigator.mediaSession.setActionHandler("pause", null);
        }
    };

    const handleSongDragged = (song: Song) => {
        console.log("handleSongDragged => song: ", song);
        setIsPlaying(prev => prev);
        setDraggedSongs(prev => prev.some(s => s.id === song.id) ? prev : [...prev, song]);
    };

    useEffect(() => {
        if (draggedSongs.length === 0 && activePage === 1) {
            setIsPlaying(true);
            setActivePage(0);
        }
    }, [draggedSongs, activePage]);

    function disableScroll(e: WheelEvent) {
        const scrollableChild = (e.target as HTMLElement)?.closest(".allow-scroll");
        if (scrollableChild) return;

        e.preventDefault();
    }

    function handleMouseEnter() {
        boxRef.current?.addEventListener("wheel", disableScroll, { passive: false });
    }

    function handleMouseLeave() {
        boxRef.current?.removeEventListener("wheel", disableScroll);
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (window.innerWidth < 1024) return;

            if (e.ctrlKey && e.key === "ArrowUp") {
                e.preventDefault();
                setIsExpanded(true);
            } else if (e.ctrlKey && e.key === "ArrowDown") {
                e.preventDefault();
                setIsExpanded(false);
            } else if (e.ctrlKey && (e.key.toLowerCase() === "x")) {
                e.preventDefault();
                handleCloseModal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Empty the draggedSongs when artist is selected
    useEffect(() => {
        if (isArtistView) {
            setDraggedSongs([]);
        }
    }, [isArtistView]);

    /**
     * Prevents rendering if modal is closed or no song is selected.
     */
    if (!isOpen || !selectedItem) return null;
    const effectiveProgress = isDragging && dragProgress !== null ? dragProgress : currentTime / duration || 0;

    return (
        <>
            {streamingUrl && currentSong && (
                <audio ref={audioRef} src={streamingUrl || currentSong?.downloadUrl || ""} controls autoPlay hidden
                    onLoadedMetadata={() => {
                        if (audioRef.current) setDuration(audioRef.current.duration);
                    }}
                    onTimeUpdate={() => {
                        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                    }}
                />
            )}

            <div className={`fixed inset-0 z-40 transition-opacity md:duration-500 ${isExpanded ? "bg-black/80 pointer-events-auto" : "bg-transparent pointer-events-none"}`} />

            <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none m-2 md:m-0">

                <div className={`md:hidden ${isExpanded ? "hidden" : "fixed bottom-0 sm-range:w-full w-full h-10 backdrop-blur bg-black rounded-t-xl pointer-events-none"}`} />

                <div ref={boxRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={(e) => e.stopPropagation()} className={`fixed justify-items-center pointer-events-auto md:w-[500px] md-range:w-[450px] sm-range:w-[400px] w-[350px] bg-zinc-950 text-white border-2 shadow-lg md:transition-all md:duration-500 md:ease-in-out ${isExpanded ? "md-range:h-[660px] md:h-[650px] rounded-2xl top-[41%] translate-y-[-40%] pt-10" : `md:h-[100px] ${isArtist(selectedItem) ? "h-[110px]" : "md-range:h-[120px] h-[120px]"} md:rounded-t-2xl md:rounded-b-none rounded-2xl translate-y-0 pt-8 bottom-4 md:bottom-[1px]`}`}>

                    <div className="flex justify-center items-center">
                        <Button tabIndex={-1} title={isLargeScreen ? isExpanded ? "Collapse (Ctrl + Arrow Down)" : "Expand (Ctrl + Arrow Up)" : isExpanded ? "Collapse" : "Expand"} className={`absolute transform -translate-x-full bg-zinc-950 hover:bg-zinc-950 opacity-70 transition-opacity hover:opacity-100 focus:outline-none outline-none ${isExpanded ? "w-9 top-0.5" : "w-7 h-7 top-0.5"}`} onClick={() => setIsExpanded((v) => !v)}>
                            <FontAwesomeIcon icon={isExpanded ? faAngleDown : faAngleUp} className="text-white" />
                        </Button>

                        <Button tabIndex={-1} title={isLargeScreen ? "Close (Ctrl + X)" : "Close"} className={`absolute transform translate-x-full bg-zinc-950 hover:bg-zinc-950 opacity-70 transition-opacity hover:opacity-100 focus:outline-none outline-none ${isExpanded ? "w-9 top-0.5" : "w-7 h-7 top-0.5"}`} onClick={handleCloseModal}>
                            <FontAwesomeIcon icon={faX} className="text-white" />
                        </Button>
                    </div>

                    <div className="justify-items-center md:w-[500px] md-range:w-[450px] sm-range:w-[400px] w-[350px] md:h-[606px] md-range:h-[615px] sm-range:h-[600px] h-[550px] border-t-2 px-2 md:p-0 md-range:p-0 md:transition-all md:duration-500 md:ease-in-out rounded-b-2xl">

                        {activePage === 0 && (
                            <div className='md:h-[572px] md-range:h-[580px] sm-range:h-[560px] h-[515px]'>
                                {!isImageLoaded && !isTimeoutOver ? (
                                    <div className={`${isExpanded ? "md:w-[400px] md-range:w-[400px] sm-range:w-[380px] md:h-[400px] md-range:h-[400px] sm-range:h-[382px] h-[334px] mt-2 md-range:mx-auto" : "absolute left-2.5 w-[55px] h-[55px] my-1"} transition-all duration-500 rounded-md`}>
                                        <div className="w-full h-full bg-zinc-800 rounded-md animate-pulse" />
                                    </div>
                                ) : (
                                    <>
                                        <Image src={image} alt={decodeHTMLEntities(name)} width={isExpanded ? 400 : 55} height={isExpanded ? 400 : 55} onDoubleClick={handleDoubleClick} priority className={`select-none transition-all md:duration-500 ${isExpanded ? "mt-2 md-range:mx-auto" : "absolute left-2.5 z-10 md:mt-1"} ${!fanCount && isRounded ? "rounded-full animate-spin-slow" : "rounded-md"} ${fanCount ? "" : "cursor-pointer"}`} style={{
                                            animationPlayState: isImageLoaded && currentTime && isPlaying ? 'running' : 'paused', boxShadow: (!fanCount && isRounded)
                                                ? "0 0 10px rgba(255, 255, 255, 1)" : "none"
                                        }} onLoad={() => setIsImageLoaded(true)}
                                            onError={() => setIsImageLoaded(true)} />

                                        <OnboardingTooltipManager id="now-playing-first-msg" isExpanded={isExpanded} />
                                    </>
                                )}
                                <h3 className={`text-center md:px-2 sm-range:px-1.5 px-1 md:w-[400px] md-range:w-[400px] sm-range:w-[380px] w-[330px] mx-auto line-clamp-2 font-Lato 
                                    ${isArtist(selectedItem) && currentSong === null
                                        ? isExpanded
                                            ? "min-h-[4px]" : "min-h-10 absolute md:right-4 right-0 leading-tight max-w-[280px] sm-range:w-[400px] md-range:max-w-[400px] md:max-w-[400px]"
                                        : isExpanded
                                            ? "min-h-[50px]"
                                            : "absolute md:right-4 md-range:right-4 right-0 min-h-10 leading-tight max-w-[280px] sm-range:max-w-[330px] md-range:max-w-[360px] md:max-w-[400px]"}`} >
                                    {overriddenTitle
                                        ? decodeHTMLEntities(overriddenTitle)
                                        : decodeHTMLEntities(name)}
                                </h3>

                                <p className={`text-sm px-2 font-Lato text-gray-400 text-center md:w-[400px] md-range:w-[400px] sm-range:w-[380px] w-[330px] mx-auto truncate ${isArtist(selectedItem) ? isExpanded && fanCount ? "min-h-4 mb-0" : "min-h-0" : isExpanded ? "min-h-6 mb-1" : "hidden"}`}>{overriddenArtist ? decodeHTMLEntities(overriddenArtist) : currentSong?.primaryArtists}</p>

                                <div>
                                    {currentSong && "downloadUrl" in currentSong ? (
                                        <div className='flex flex-col md:my-0 my-1'>
                                            <div className={`select-none mx-auto md:my-0 md-range:my-0 my-1 ${isExpanded ? "md:w-[400px] md-range:w-[390px] sm-range:w-[370px] w-[320px]" : "flex absolute right-10 bottom-1 md-range:bottom-2 md:w-[377px] md-range:w-[394px] sm-range:w-[340px] w-[290px]"}`}>

                                                {!isImageLoaded && !isTimeoutOver ? (
                                                    <div className="w-full h-2 bg-gray-600 rounded-[2px] animate-pulse" />
                                                ) : (
                                                    <div ref={progressBarRef} className="w-full h-2 bg-gray-600 rounded-[2px] relative cursor-pointer" onMouseDown={handleMouseDown} onTouchStart={(e) => {
                                                        if (e.touches.length > 0) {
                                                            setIsDragging(true);
                                                            updateCurrentTimeFromTouch(e.touches[0].clientX);
                                                        }
                                                    }}>
                                                        <div className="absolute top-0 left-0 h-full bg-white rounded-[2px]" style={{ width: `${effectiveProgress * 100}%` }} />
                                                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500" style={{ left: `${effectiveProgress * 100}%`, transform: "translate(-50%, -50%)" }} />
                                                    </div>
                                                )}
                                                <div className={`border border-transparent ${isExpanded ? "" : "flex absolute right-0 bottom-3"}`}>
                                                    {!isExpanded && (
                                                        <span className="absolute text-xs font-Lato text-gray-300 ml-2">
                                                            {formatTime(currentTime)}
                                                        </span>
                                                    )}
                                                </div>

                                                {isExpanded && (
                                                    <div className="flex justify-between text-sm font-Lato text-gray-300 pt-1">
                                                        <span>{formatTime(currentTime)}</span>
                                                        <span>{formatTime(duration)}</span>
                                                    </div>
                                                )}
                                            </div>


                                            <div className={`grid grid-flow-col mx-auto my-1 justify-between ${isExpanded ? "md:w-[400px] md-range:w-[390px] sm-range:w-[370px]" : "hidden"}`}>

                                                <div className="relative flex group items-center h-7">
                                                    {volume === 0 ? (
                                                        <FontAwesomeIcon icon={faVolumeXmark} title='Unmute' onClick={toggleMute} className=" text-blue-500 h-7 w-7 cursor-pointer" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faVolumeHigh} title='Mute' onClick={toggleMute} className="m text-white h-7 w-7 cursor-pointer" />
                                                    )}

                                                    <div ref={volumeBarRef} onClick={handleVolumeBarClick} onMouseDown={(e) => {
                                                        updateVolumeByClientX(e.clientX); handleVolumeMouseDown();
                                                    }} onTouchStart={(e) => { if (e.touches.length > 0) { updateVolumeByClientX(e.touches[0].clientX); handleVolumeTouchStart(); } }} className="absolute top-10 w-24 h-2.5 cursor-pointer my-0 ml-1">
                                                        <div className="w-24 bg-gray-600 rounded-[2px] cursor-pointer">
                                                            <div className="absolute top-0 left-0 h-2 bg-white rounded-[2px]" style={{ width: `${volume * 100}%` }} />
                                                            <div className="absolute top-[36%] -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500" style={{ left: `${volume * 100}%`, transform: "translate(-50%, -50%)" }} />
                                                        </div>
                                                        <div className="absolute -right-12 -top-[11px] select-none cursor-default">
                                                            <span className="text-xs font-Lato text-white">{Math.round(volume * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <FontAwesomeIcon icon={faRepeat} onClick={repeat} title='Repeat' className={`ml-5 h-7 w-7 cursor-pointer ${isRepeat ? "text-blue-500" : "text-white"}`} />

                                                <FontAwesomeIcon icon={faBackwardStep} onClick={prev} title='Previous' className="mx-5 text-white h-7 w-7 cursor-pointer" />

                                                {isPlaying ?
                                                    (
                                                        <FontAwesomeIcon icon={faPause} onClick={togglePlay} title='Pause' className="text-white h-7 w-7 cursor-pointer relative" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faPlay} onClick={togglePlay} title='Play' className="text-white h-7 w-7 cursor-pointer relative left-0.5" />
                                                    )}

                                                <FontAwesomeIcon icon={faForwardStep} onClick={next} title='Next' className="mx-5 text-white h-7 w-7 cursor-pointer" />

                                                <FontAwesomeIcon icon={faShuffle} onClick={shuffle} title='Shuffle' className={`mr-5 h-7 w-7 cursor-pointer ${isShuffle || pendingShuffle ? "text-blue-500" : "text-white"}`} />

                                                <div className="flex items-center">
                                                    <FontAwesomeIcon onClick={!isDownloading ? handleDownload : undefined} icon={isDownloading ? faSpinner : faDownload} spin={isDownloading} title={isDownloading ? 'Downloading...' : 'Download'} className={`ml-0 h-7 w-7 cursor-pointer transition-all duration-300 ${isDownloading ? 'text-blue-500 animate-spin' : 'text-white'}`} />
                                                    <span className="text-xs font-Lato text-white absolute md:bottom-7 md-range:bottom-9 bottom-7 md:right-12 md-range:right-7 sm-range:right-3 right-4 select-none">{isDownloading ? `${downloadProgress}%` : ''}</span>
                                                </div>

                                            </div>
                                        </div>
                                    ) : isArtistView ? (
                                        <>
                                            {fanCount && (
                                                <p className={`text-sm font-Lato text-center text-gray-400 select-none md:w-[400px] w-[330px] ${isExpanded ? "border-b border-dashed pb-2" : "border-b border-transparent absolute md:right-4 right-0 md:bottom-1 bottom-1 max-w-[280px] md:max-w-[400px]"}`}>{fanCount} Fans</p>
                                            )}

                                            <div className={`grid grid-flow-col mx-auto justify-items-center my-12 ${isExpanded ? "" : "hidden"}`}>
                                                <FontAwesomeIcon icon={faBackwardStep} onClick={prevArtist} title='Previous' className="text-white h-7 w-7 cursor-pointer" />
                                                <FontAwesomeIcon icon={faForwardStep} onClick={nextArtist} title='Next' className="text-white h-7 w-7 cursor-pointer" />
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {draggedSongs.length > 0 && (
                            <QueuedSongs
                                isExpanded={activePage === 1}
                                isHeightExpanded={isHeightExpanded}
                                draggedSongs={draggedSongs}
                                onSongSelect={handleSongSelect}
                                setDraggedSongs={setDraggedSongs}
                            />
                        )}

                        <AlbumAndRecommendationSongs
                            key={`album-${currentArtist?.id || "0"}`}
                            currentSong={currentSong}
                            isExpanded={activePage === 2}
                            isHeightExpanded={isHeightExpanded}
                            artistName={artistHelper ? (currentSong?.primaryArtists || name) : ""}
                            onSongSelect={handleSongSelect}
                            draggedSongs={draggedSongs}
                            onSongDragged={handleSongDragged}
                            recommendedSongs={recommendedSongs}
                            albumSongs={albumSongs}
                            setRecommendedSongs={setRecommendedSongs}
                            setAlbumSongs={setAlbumSongs}
                        />

                        {isExpanded && (
                            <div className="absolute left-1/2 -translate-x-1/2 my-1.5 w-32 flex justify-center gap-4 z-10">
                                {(draggedSongs.length > 0 ? [0, 1, 2] : [0, 2]).map((index) => (
                                    <div key={index} onClick={() => setActivePage(index)} className={`w-4 h-4 rounded-full cursor-pointer ${activePage === index ? "bg-white animate-pulse border-2 border-blue-500" : "bg-gray-400"}`} />
                                ))}

                                <OnboardingTooltipManager id="now-playing-second-msg" isExpanded={isExpanded} />
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    )
}   