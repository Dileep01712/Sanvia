import { useState, useRef, useEffect, useCallback } from "react";
import { Song } from "@/lib/songTypes";
import { getStreamingUrl } from "@/lib/getStreamingUrl";
import { getBestQualityDownload } from "@/lib/helpers";

const VOLUME_STORAGE_KEY = "audioPlayerVolume";
const MUTE_STORAGE_KEY = "audioPlayerMuted";

export function useAudioPlayer(
    currentSong: Song | null,
    isImageLoaded: boolean,
    onSongEnd?: () => void,
) {
    const [volume, setVolume] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(VOLUME_STORAGE_KEY);
            if (saved !== null) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
            }
        }
        return 1;
    });

    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
        }
        return false;
    });

    const [streamingUrl, setStreamingUrl] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isRepeat, setIsRepeat] = useState(false);
    const [resolvedTitle, setOverriddenTitle] = useState<string | null>(null);
    const [resolvedArtist, setOverriddenArtist] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bufferedPercent, setBufferedPercent] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousVolumeRef = useRef(volume);
    const onSongEndRef = useRef(onSongEnd);
    const currentSongRef = useRef(currentSong);
    const hasEverPlayedRef = useRef(false);
    const isLoadedRef = useRef(false);
    const effectiveVolumeRef = useRef(isMuted ? 0 : volume);
    const autoPlayNextRef = useRef(false);
    const isNewSrcLoadingRef = useRef(false);

    useEffect(() => {
        const downloadUrl = currentSong?.downloadUrl?.toString();
        if (!downloadUrl?.includes("/album/")) {
            setOverriddenTitle(null);
            setOverriddenArtist(null);
        }
    }, [currentSong]);

    useEffect(() => {
        onSongEndRef.current = onSongEnd;
    }, [onSongEnd]);

    useEffect(() => {
        currentSongRef.current = currentSong;
    }, [currentSong]);

    useEffect(() => {
        effectiveVolumeRef.current = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    const setAudioRef = useCallback((el: HTMLAudioElement | null) => {
        if (audioRef.current === el) return;
        audioRef.current = el;
        setAudioElement(el);
        if (el) {
            el.volume = effectiveVolumeRef.current;
        }
    }, []);

    useEffect(() => {
        if (!currentSong || !isImageLoaded) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
                audioRef.current.currentTime = 0;
            }

            setStreamingUrl("");
            setOverriddenTitle(null);
            setOverriddenArtist(null);
            setIsPlaying(false);
            setDuration(0);
            setCurrentTime(0);
            setIsLoading(false);
            hasEverPlayedRef.current = false;
            isLoadedRef.current = false;
            return;
        }

        const audio = audioRef.current;
        if (!audio) return;

        const downloadUrl = getBestQualityDownload(currentSong.downloadUrl);
        if (downloadUrl.includes("/album/")) {
            setIsLoading(true);
            return;
        }

        if (currentSong.streamingUrl) {
            const url = currentSong.streamingUrl;
            setStreamingUrl(url);
            setOverriddenTitle(null);
            setOverriddenArtist(null);

            if (audio.src !== url) {
                setIsLoading(true);
                audio.src = url;
                audio.load();
                audio.volume = effectiveVolumeRef.current;
            }
            return;
        }

        const controller = new AbortController();
        const load = async () => {
            setIsLoading(true);

            try {
                const { url, name, primaryArtists } = await getStreamingUrl(
                    currentSong.id,
                    currentSong.name,
                    downloadUrl
                );

                if (!controller.signal.aborted && url) {
                    setStreamingUrl(url);
                    setOverriddenTitle(name);
                    setOverriddenArtist(primaryArtists);

                    const audioEl = audioRef.current;
                    if (audioEl && audioEl.src !== url) {
                        isNewSrcLoadingRef.current = true;
                        setIsLoading(true);
                        audioEl.src = url;
                        audioEl.load();
                        audioEl.volume = effectiveVolumeRef.current;
                    }
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.error("Failed to load streaming URL:", err);
                    setStreamingUrl("");
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSong?.id, currentSong?.streamingUrl, isImageLoaded]);

    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
            }
        };
    }, []);

    useEffect(() => {
        const audio = audioElement;
        if (!audio) return;

        const handleWaiting = () => {
            setIsLoading(true);
        };

        const handleCanPlay = () => {
            setIsLoading(false);
            if (autoPlayNextRef.current && isNewSrcLoadingRef.current) {
                autoPlayNextRef.current = false;
                isNewSrcLoadingRef.current = false;
                audio.play().catch(console.warn);
            }
        };

        const handlePlaying = () => {
            setIsLoading(false);
            setIsPlaying(true);
            hasEverPlayedRef.current = true;
        };

        const handlePlay = () => {
            setIsPlaying(true);
            hasEverPlayedRef.current = true;
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            if (isRepeat) {
                audio.currentTime = 0;
                audio.play().catch(console.error);
                return;
            }

            autoPlayNextRef.current = true;

            const hasValidUrl = currentSongRef.current?.downloadUrl;
            const hasPlayed = hasEverPlayedRef.current && audio.duration > 0;
            if (hasValidUrl && hasPlayed && onSongEndRef.current) {
                onSongEndRef.current();
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            handleProgress();
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            if (audio.duration > 0) {
                hasEverPlayedRef.current = true;
                isLoadedRef.current = true;
            }
        };

        const handleError = (e: Event) => {
            const target = e.target as HTMLAudioElement;

            if (!target.src || target.src === "") {
                return;
            }

            if (target.error?.code === 1) {
                return;
            }

            if (target.networkState !== 3) {
                return;
            }

            // console.warn("Audio error (fatal):", e);
            setIsLoading(false);

        };

        const handleAbort = () => {
            setIsLoading(false);
        };

        const handleLoadStart = () => {
            setIsLoading(true);
        };

        const handleProgress = () => {
            if (audio.buffered.length > 0 && audio.duration > 0) {
                const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
                setBufferedPercent((bufferedEnd / audio.duration) * 100);
            }
        };

        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("playing", handlePlaying);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("error", handleError);
        audio.addEventListener("abort", handleAbort);
        audio.addEventListener("loadstart", handleLoadStart);
        audio.addEventListener("progress", handleProgress);

        if (audio.readyState >= 2) {
            setIsLoading(false);
        }

        return () => {
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("playing", handlePlaying);
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("error", handleError);
            audio.removeEventListener("abort", handleAbort);
            audio.removeEventListener("loadstart", handleLoadStart);
            audio.removeEventListener("progress", handleProgress);
        };
    }, [audioElement, isRepeat]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }

        if (typeof window !== "undefined") {
            localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
            localStorage.setItem(MUTE_STORAGE_KEY, isMuted.toString());
        }

        if (volume !== 0) {
            previousVolumeRef.current = volume;
        }
    }, [volume, isMuted]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch(console.error);
        } else {
            audio.pause();
        }
    }, []);

    const seek = useCallback((percent: number) => {
        const audio = audioRef.current;
        if (audio && duration > 0) {
            audio.currentTime = percent * duration;
            setCurrentTime(audio.currentTime);
        }
    }, [duration]);

    const setVolumeLevel = useCallback((level: number) => {
        const newVol = Math.min(1, Math.max(0, level));
        setVolume(newVol);
        if (newVol === 0) {
            setIsMuted(true);
        } else {
            setIsMuted(false);
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (isMuted || volume === 0) {
            setVolume(previousVolumeRef.current || 0.5);
            setIsMuted(false);
        } else {
            previousVolumeRef.current = volume;
            setVolume(0);
            setIsMuted(true);
        }
    }, [isMuted, volume]);

    return {
        audioRef: setAudioRef,
        streamingUrl,
        resolvedTitle,
        resolvedArtist,
        isPlaying,
        duration,
        currentTime,
        volume,
        isMuted,
        isRepeat,
        isLoading,
        bufferedPercent,
        togglePlay,
        seek,
        setVolumeLevel,
        toggleMute,
        setIsRepeat,
    };
}