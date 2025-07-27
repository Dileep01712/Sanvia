"use client";


import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Song, Album, Artist, downloadSong } from '@/lib/songs';
import { getStreamingUrlFromSaavn } from '@/lib/getStreamingUrl';
import AlbumAndRecommendationSongs from "./AlbumAndRecommendationSongs"
import { Button } from '@/components/ui/button';
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
    item: ModalItem | null;
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
    item,
    playlist,
    topArtists,
    onArtistChange,
    setPlaylist,
    artistHelper,
}: NowPlayingModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
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
    const [, setLastSongId] = useState<string | null>(null);
    const [isRepeat, setIsRepeat] = useState(false);
    const hasLoadedRef = useRef<string | null>(null);
    const volumeBarRef = useRef<HTMLDivElement | null>(null);
    const previousVolumeRef = useRef<number>(1);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [activePage, setActivePage] = useState(0);
    const [isHeightExpanded, setIsHeightExpanded] = useState(false);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isVolumeDragging, setIsVolumeDragging] = useState(false);
    const [isRounded, setIsRounded] = useState(false);

    // Set the current song based on the currentIndex
    let currentSong = !isArtist(item) && playlist.length > 0 && currentIndex >= 0 ? playlist[currentIndex] : null;

    const isArtistView = item ? isArtist(item) : false;
    const currentArtist = isArtistView ? (item as Artist) : null;

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

        // Priority 1: Use playlist context if available
        if (!isArtist(item) && playlist.length > 0 && currentIndex >= 0) {
            return buildSongObject(playlist[currentIndex]);
        }

        // Priority 2: Use selectedSong if available
        if (selectedSong) {
            return buildSongObject(selectedSong);
        }

        return null;
    }, [selectedSong, playlist, currentIndex, item]);

    /**
     * Sets the current index when a new item is passed to the modal.
     * Finds the item in the playlist and sets it as the current song.
     */
    useEffect(() => {
        if (item) {
            const index = playlist.findIndex((song) => song.id === item.id);
            setCurrentIndex(index);
            setLastSongId(playlist[index]?.id ?? null);
        }
    }, [item, playlist]);

    /**
     * Fetches and sets the streaming URL for the current song when it changes
     * Only triggers if the image is loaded to ensure smoother playback experience.
     */
    useEffect(() => {
        if (!currentSong || (!currentSong.streamingUrl && !currentSong.downloadUrl) || (!isImageLoaded && !isArtist(item))) {
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
            return;
        }

        // Only proceed if this song wasn't just loaded (prevents double-fetch on same song in dev)
        if (hasLoadedRef.current === currentSong.id) return;

        hasLoadedRef.current = currentSong.id;

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
                    if (item && "downloadUrl" in item) {
                        setStreamingUrl(url);
                    } else {
                        setStreamingUrl("");
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
    }, [currentSong, isImageLoaded, item]);

    /**
     * Moves to the next song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the next song in order.
     * Pauses audio if at the end of the playlist in normal mode.
     */
    const next = useCallback(() => {
        let shouldShuffle = isShuffle;

        if (pendingShuffle) {
            setIsShuffle(true);
            setPendingShuffle(false);
            shouldShuffle = true;
        }

        if (shouldShuffle) {
            let randomIndex = currentIndex;
            while (playlist.length > 1 && (!playlist[randomIndex]?.downloadUrl || randomIndex === currentIndex)) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
            setCurrentIndex(randomIndex);
            return;
        }

        let nextIndex = currentIndex + 1;
        while (nextIndex < playlist.length && !playlist[nextIndex]?.downloadUrl) {
            nextIndex++;
        }

        if (nextIndex < playlist.length) {
            setCurrentIndex(nextIndex);
            setLastSongId(playlist[nextIndex]?.id ?? null);
        } else {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    }, [currentIndex, playlist, isShuffle, pendingShuffle]);

    /**
     * Moves to the previous song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the previous song in circular order.
     */
    const prev = () => {
        if (isShuffle) {
            let randomIndex = currentIndex;
            while (playlist.length > 1 && (!playlist[randomIndex]?.downloadUrl || randomIndex === currentIndex)) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
            setCurrentIndex(randomIndex);
        } else {
            setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
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

            if (isArtist(item) && audio.src) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
                setIsPlaying(false);
            }
        };
    }, [streamingUrl, isImageLoaded, next, isRepeat, isOpen, item]);

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
    }, [item]);

    // Check Artist
    function isArtist(item: ModalItem | null): item is Artist {
        return !!item && typeof item === "object" && "follower_count" in item;
    }

    // Clear Current Audio
    useEffect(() => {
        if (!item || !("downloadUrl" in item)) {
            setStreamingUrl("");
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
            }
        }
    }, [item]);

    // Get Artist
    useEffect(() => {
        if (item && isArtist(item) && topArtists.length > 0) {
            const index = topArtists.findIndex((artist) => artist.id === item.id);
            if (index !== -1 && index !== currentIndex) {
                setCurrentIndex(index);
            } else if (index === -1) {
                console.warn(`Artist ${item.name} not found in topArtists`);
            }
        }
    }, [item, topArtists, currentIndex]);

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

    // Song Select`
    const handleSongSelect = (song: Song, recommended: Song[]) => {
        setPlaylist([]);
        const newPlaylist = recommended;
        setPlaylist(newPlaylist);

        const index = newPlaylist.findIndex(s => s.id === song.id);
        setCurrentIndex(index !== -1 ? index : 0);
        setSelectedSong(song);
    };

    useEffect(() => {
        if (selectedSong) {
            setPlaylist([]);
        }
    }, [selectedSong, setPlaylist]);

    // Song Download
    const handleDownload = async () => {
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
        setIsExpanded(true);
        setIsModalOpen(false);
        setIsPlaying(false);
        setStreamingUrl("");

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

        // 🧹 OPTIONAL: Reset currentSong and other related states
        setCurrentIndex(-1);
        setPlaylist([]);
        // Or: setCurrentSong(null) if you're using that state
    };

    /**
     * Prevents rendering if modal is closed or no song is selected.
     */
    if (!isOpen || !item) return null;
    const effectiveProgress = isDragging && dragProgress !== null ? dragProgress : currentTime / duration || 0;

    return (
        <>
            {streamingUrl && (
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

                <div className={`md:hidden ${isExpanded ? "hidden" : "fixed bottom-0 w-full h-10 backdrop-blur bg-black rounded-t-xl pointer-events-none"}`} />

                <div onClick={(e) => e.stopPropagation()} className={`fixed justify-items-center pointer-events-auto md:w-[500px] w-[350px] bg-zinc-950 text-white border-2 shadow-lg md:transition-all md:duration-500 md:ease-in-out ${isExpanded ? "md:h-[650px] rounded-2xl top-[41%] translate-y-[-40%] pt-10" : "md:h-[100px] h-[135px] md:rounded-t-2xl md:rounded-b-none rounded-2xl translate-y-0 pt-8 bottom-4 md:bottom-[1px]"}`} >

                    <div className="flex justify-center items-center">
                        <Button tabIndex={-1} title={isExpanded ? "Collapse" : "Expand"} className={`absolute transform -translate-x-full bg-zinc-950 hover:bg-zinc-950 opacity-70 transition-opacity hover:opacity-100 focus:outline-none outline-none ${isExpanded ? "w-9 top-0.5" : "w-7 h-7 top-0.5"}`} onClick={() => setIsExpanded((v) => !v)}>
                            <FontAwesomeIcon icon={isExpanded ? faAngleDown : faAngleUp} className="text-white" />
                        </Button>

                        <Button tabIndex={-1} title='Close' className={`absolute transform translate-x-full bg-zinc-950 hover:bg-zinc-950 opacity-70 transition-opacity hover:opacity-100 focus:outline-none outline-none ${isExpanded ? "w-9 top-0.5" : "w-7 h-7 top-0.5"}`} onClick={handleCloseModal}>
                            <FontAwesomeIcon icon={faX} className="text-white" />
                        </Button>
                    </div>

                    <div className="justify-items-center md:w-[500px] w-[350px] md:h-[585px] h-[580px] border-t-2 p-2 md:p-0" >

                        {activePage === 0 && (
                            <div className='md:h-[575px]'>
                                {!isImageLoaded && !isTimeoutOver ? (
                                    <div className={`${isExpanded ? "md:w-[400px] md:h-[400px] h-[334px] my-2" : "absolute left-2.5 md:w-[55px] md:h-[55px] my-1"} transition-all duration-500`}>
                                        <div className="w-full h-full bg-zinc-800 rounded-md animate-pulse" />
                                    </div>
                                ) : (
                                    <Image src={image} alt={decodeHTMLEntities(name)} width={isExpanded ? 400 : 55} height={isExpanded ? 400 : 55} onDoubleClick={handleDoubleClick} className={`select-none transition-all md:duration-500 ${isExpanded ? "my-2" : "absolute left-2.5 z-"} ${!fanCount && isRounded ? "rounded-full animate-spin-slow" : "rounded-md"} ${fanCount ? "" : "cursor-pointer"}`} style={{
                                        animationPlayState: isImageLoaded && currentTime && isPlaying ? 'running' : 'paused', boxShadow: (!fanCount && isRounded)
                                            ? "0 0 10px rgba(255, 255, 255, 1)" : "none"
                                    }} onLoad={() => setIsImageLoaded(true)}
                                        onError={() => setIsImageLoaded(true)} />
                                )}
                                <h3 className={`text-center md:px-2 px-1 md:w-[400px] w-[330px] mx-auto line-clamp-2 font-Lato ${isArtist(item) ? isExpanded ? "min-h-[4px]" : "min-h-10" : isExpanded ? "min-h-[50px]" : "absolute md:right-4 right-0 min-h-10 leading-tight w-[279px]"}`} >{overriddenTitle ? decodeHTMLEntities(overriddenTitle) : decodeHTMLEntities(name)}</h3>
                                <p className={`text-sm px-2 font-Lato text-gray-400 text-center md:w-[400px] w-[330px] mx-auto truncate ${isArtist(item) ? isExpanded ? "min-h-4 mb-0" : "min-h-0" : isExpanded ? "min-h-6 mb-1" : "hidden"}`}>{overriddenArtist ? decodeHTMLEntities(overriddenArtist) : isArtist(item) ? "" : currentSong?.primaryArtists}</p>

                                <div>
                                    {currentSong && "downloadUrl" in currentSong ? (
                                        <div className='flex flex-col md:my-0 my-2'>
                                            <div className={`select-none mx-auto md:my-0 my-1 ${isExpanded ? "md:w-[400px] w-[320px]" : "flex absolute right-10 md:bottom-2 bottom-1 md:w-[377px] w-[290px]"}`}>

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
                                                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-400" style={{ left: `${effectiveProgress * 100}%`, transform: "translate(-50%, -50%)" }} />
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


                                            <div className={`grid grid-flow-col mx-auto md:my-1 my-2 ${isExpanded ? "" : "hidden"}`}>

                                                <div className="relative flex group items-center h-7">
                                                    {volume === 0 ? (
                                                        <FontAwesomeIcon icon={faVolumeXmark} title='Unmute' onClick={toggleMute} className=" text-blue-400 h-7 w-7 cursor-pointer" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faVolumeHigh} title='Mute' onClick={toggleMute} className="m text-white h-7 w-7 cursor-pointer" />
                                                    )}

                                                    <div ref={volumeBarRef} onClick={handleVolumeBarClick} onMouseDown={(e) => {
                                                        updateVolumeByClientX(e.clientX);
                                                        handleVolumeMouseDown();
                                                    }} onTouchStart={(e) => {
                                                        if (e.touches.length > 0) {
                                                            updateVolumeByClientX(e.touches[0].clientX);
                                                            handleVolumeTouchStart();
                                                        }
                                                    }} className="absolute top-10 w-24 h-2.5 cursor-pointer md:my-0 my-2 ml-1.5">

                                                        <div className="w-24 bg-gray-600 rounded-[2px] cursor-pointer">
                                                            <div className="absolute top-0 left-0 h-2 bg-white rounded-[2px]" style={{ width: `${volume * 100}%` }} />
                                                            <div className="absolute top-[36%] -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-400" style={{ left: `${volume * 100}%`, transform: "translate(-50%, -50%)" }} />
                                                        </div>
                                                        <div className="absolute -right-10 -top-[11px] select-none cursor-default">
                                                            <span className="text-xs font-Lato text-white">{Math.round(volume * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <FontAwesomeIcon icon={faRepeat} onClick={repeat} title='Repeat' className={`ml-5 h-7 w-7 cursor-pointer ${isRepeat ? "text-blue-400" : "text-white"}`} />

                                                <FontAwesomeIcon icon={faBackwardStep} onClick={prev} title='Previous' className="mx-5 text-white h-7 w-7 cursor-pointer" />

                                                {isPlaying ?
                                                    (
                                                        <FontAwesomeIcon icon={faPause} onClick={togglePlay} title='Pause' className="text-white h-7 w-7 cursor-pointer relative" />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faPlay} onClick={togglePlay} title='Play' className="text-white h-7 w-7 cursor-pointer relative left-0.5" />
                                                    )}

                                                <FontAwesomeIcon icon={faForwardStep} onClick={next} title='Next' className="mx-5 text-white h-7 w-7 cursor-pointer" />

                                                <FontAwesomeIcon icon={faShuffle} onClick={shuffle} title='Shuffle' className={`mr-5 h-7 w-7 cursor-pointer ${isShuffle || pendingShuffle ? "text-blue-400" : "text-white"}`} />

                                                <div className="flex items-center">
                                                    <FontAwesomeIcon onClick={!isDownloading ? handleDownload : undefined} icon={isDownloading ? faSpinner : faDownload} spin={isDownloading} title={isDownloading ? 'Downloading...' : 'Download'} className={`ml-0 h-7 w-7 cursor-pointer transition-all duration-300 ${isDownloading ? 'text-blue-400 opacity-70 animate-spin' : 'text-white'}`} />
                                                    <span className="text-xs font-Lato text-white absolute md:bottom-5 bottom-8 md:right-[86px] select-none">{isDownloading ? `${downloadProgress}%` : ''}</span>
                                                </div>

                                            </div>
                                        </div>
                                    ) : isArtistView ? (
                                        <>
                                            {fanCount && (
                                                <p className={`text-sm font-Lato text-center text-gray-400 select-none ${isExpanded ? "border-b border-dashed pb-2" : "border-b border-transparent"}`}>{fanCount} Fans</p>
                                            )}

                                            <div className={`grid grid-flow-col mx-auto justify-items-center my-3 ${isExpanded ? "" : "hidden"}`}>
                                                <FontAwesomeIcon icon={faBackwardStep} onClick={prevArtist} title='Previous' className="text-white h-7 w-7 cursor-pointer" />
                                                <FontAwesomeIcon icon={faForwardStep} onClick={nextArtist} title='Next' className="text-white h-7 w-7 cursor-pointer" />
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        <AlbumAndRecommendationSongs
                            key={`album-${currentArtist?.id || "0"}`}
                            currentSong={currentSong}
                            isExpanded={activePage === 1}
                            isHeightExpanded={isHeightExpanded}
                            artistName={artistHelper ? (currentSong?.primaryArtists || name) : ""}
                            onSongSelect={handleSongSelect}
                        />

                        {isExpanded && (
                            <div className="absolute bottom-1 md:w-full flex justify-center gap-2 w-[342px] z-10">
                                {[0, 1].map((index) => (
                                    <div key={index} onClick={() => setActivePage(index)} className={`w-3 h-3 rounded-full cursor-pointer md:mr-0 mr-1 ${activePage === index ? "bg-white animate-pulse border-2 border-blue-700" : "bg-gray-400"}`} />
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    )
}   