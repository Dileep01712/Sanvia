"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { Song, Artist } from "@/lib/songTypes";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useQueue } from "./hooks/useQueue";
import { useMediaSession } from "./hooks/useMediaSession";
import { useDownload } from "./hooks/useDownload";
import ProgressBar from "./components/ProgressBar";
import VolumeControl from "./components/VolumeControl";
import PlayerControls from "./components/PlayerControls";
import ModalHeader from "./components/PlayerHeader";
import QueuedSongs from "../Queue/QueueList";
import AlbumAndRecommendationSongs from "../RelatedSongs/RelatedSongsView";
import { useAlbumRecommendations } from "../RelatedSongs/hooks/useRelatedSongs";
import { useImageColor } from "../Home/hooks/useImageColor";
import OnboardingTooltipManager from "../Tooltips/OnboardingTooltipManager";
import { BadgeCheck } from 'lucide-react';
import { usePlayerStore, ModalItem } from "@/store/usePlayerStore";
import {
    formatTime,
    decodeHTMLEntities,
    getBestQualityDownload,
    getBestQualityImage,
    formatFollowerCount
} from "@/lib/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlay,
    faPause,
    faForwardStep,
    faChevronLeft,
    faChevronRight,
    faCircleNotch
} from "@fortawesome/free-solid-svg-icons";

const isArtist = (item: ModalItem | null): item is Artist => !!item && "follower_count" in item;

export default function NowPlayingModal() {
    const loading = usePlayerStore((state) => state.loading);
    const isExpanded = usePlayerStore((state) => state.isExpanded);
    const selectedItem = usePlayerStore((state) => state.selectedItem);
    const artistHelper = usePlayerStore((state) => state.artistHelper);
    const isModalOpen = usePlayerStore((state) => state.isModalOpen);
    const topArtists = usePlayerStore((state) => state.topArtists);
    const openModal = usePlayerStore((state) => state.openModal);
    const contextId = usePlayerStore((state) => state.contextId);
    const rawCurrentSong = usePlayerStore((state) => state.currentSong);
    const activeSource = usePlayerStore((state) => state.activeSource);
    const play = usePlayerStore((state) => state.play);
    const next = usePlayerStore((state) => state.next);
    const resetPlayback = usePlayerStore((state) => state.resetPlayback);
    const setIsExpanded = usePlayerStore((state) => state.setIsExpanded);
    const closeModal = usePlayerStore((state) => state.closeModal);
    const fetchedAlbumSongs = usePlayerStore((state) => state.albumSongs);
    const fetchedRecSongs = usePlayerStore((state) => state.recommendedSongs);

    const { draggedSongs, setDraggedSongs, addToQueue } = useQueue();
    const { isDownloading, downloadProgress, triggerDownload } = useDownload();

    const [activePage, setActivePage] = useState(0);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [forceSongView, setForceSongView] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const isArtistView = isArtist(selectedItem) && !forceSongView;

    const isProcessingNext = useRef(false);
    const internalAudioRef = useRef<HTMLAudioElement | null>(null);

    const currentSong = useMemo(() => {
        if (isArtistView || !rawCurrentSong) return null;

        return {
            ...rawCurrentSong,
            image: getBestQualityImage(rawCurrentSong.image),
            name: rawCurrentSong.name,
            primaryArtists: rawCurrentSong.artists?.primary?.map(a => a.name).join(", ") || rawCurrentSong.primaryArtists || "",
            downloadUrl: rawCurrentSong.downloadUrl,
            streamingUrl: rawCurrentSong.streamingUrl,
        };
    }, [rawCurrentSong, isArtistView]);

    const songForRecommendations = isArtistView ? null : currentSong;
    const artistNameForRecommendations = isArtistView
        ? (selectedItem as Artist).name
        : (artistHelper ? (currentSong?.primaryArtists || selectedItem?.name) : "");

    const { reset: resetRecommendations } = useAlbumRecommendations(songForRecommendations, artistNameForRecommendations);

    const audio = useAudioPlayer(currentSong, true, next);
    const {
        audioRef,
        streamingUrl,
        overriddenTitle,
        overriddenArtist,
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
    } = audio;

    useMediaSession(currentSong);

    const currentArtist = isArtistView ? (selectedItem as Artist) : null;
    const _imageCandidate = isArtistView ? getBestQualityImage(currentArtist?.image) : currentSong?.image || "";
    const image = Array.isArray(_imageCandidate) ? (_imageCandidate[0]?.url || "") : (_imageCandidate || "");
    const title = isArtistView ? (currentArtist?.name || "") : (overriddenTitle || currentSong?.name || "");
    const subtitle = isArtistView ? null : (overriddenArtist || currentSong?.primaryArtists || "");
    const followerCount = currentArtist?.follower_count ? Number(currentArtist.follower_count) : null;

    const dynamicBgColor = useImageColor(image);

    useEffect(() => {
        if (isModalOpen && title) {
            const cleanTitle = decodeHTMLEntities(title);
            const cleanSubtitle = subtitle ? ` • ${decodeHTMLEntities(subtitle)}` : "";

            document.title = `${cleanTitle}${cleanSubtitle}`;
        } else {
            document.title = "Sanvia - Personal Music Companion";
        }

        return () => {
            document.title = "Sanvia - Personal Music Companion";
        };
    }, [title, subtitle, isPlaying, isModalOpen]);

    useEffect(() => {
        const downloadUrl = getBestQualityDownload(currentSong?.downloadUrl);
        const albumData = currentSong?.album as { url?: string };

        const isAlbumContainer =
            downloadUrl.includes("/album/") ||
            (albumData?.url && albumData.url.includes("/album/")) ||
            (currentSong?.url && currentSong.url.includes("/album/")) ||
            (currentSong?.downloadUrl && typeof currentSong.downloadUrl === 'string' && currentSong.downloadUrl.includes("/album/"));

        if (isAlbumContainer && activeSource === "homeFeed" && fetchedAlbumSongs.length > 0 && contextId === currentSong?.id) {
            play("album", 0);
        }
    }, [currentSong, activeSource, fetchedAlbumSongs.length, play, contextId]);

    useEffect(() => {
        setForceSongView(false);
    }, [selectedItem]);

    useEffect(() => {
        setIsImageLoaded(false);
        setImageError(false);
        setRetryKey(0);
    }, [image]);

    useEffect(() => {
        let retryTimer: NodeJS.Timeout;
        if (imageError && image) {
            retryTimer = setTimeout(() => {
                setImageError(false);
                setIsImageLoaded(false);
                setRetryKey(prev => prev + 1);
            }, 3000);
        }
        return () => clearTimeout(retryTimer);
    }, [imageError, image]);

    const handleAudioRef = useCallback((el: HTMLAudioElement | null) => {
        internalAudioRef.current = el;
        audioRef(el);
    }, [audioRef]);

    const handleClose = useCallback((e?: React.SyntheticEvent | KeyboardEvent) => {
        if (e) e.preventDefault();
        const audio = internalAudioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.removeAttribute("src");
            audio.load();
        }

        resetPlayback();
        resetRecommendations();
        setDraggedSongs([]);
        closeModal();
        setIsExpanded(false);

        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: "",
                artist: "",
                artwork: [],
            });
            navigator.mediaSession.setActionHandler("play", null);
            navigator.mediaSession.setActionHandler("pause", null);
        }
    }, [closeModal, setIsExpanded, resetPlayback, resetRecommendations, setDraggedSongs]);

    useEffect(() => {
        if (isModalOpen && isExpanded) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = originalOverflow; };
        }
    }, [isModalOpen, isExpanded]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (window.innerWidth < 1024) return;
            if (e.ctrlKey && e.key === "ArrowUp") {
                e.preventDefault();
                setIsExpanded(true);
            } else if (e.ctrlKey && e.key === "ArrowDown") {
                e.preventDefault();
                setIsExpanded(false);
            } else if (e.ctrlKey && e.key.toLowerCase() === "x") {
                e.preventDefault();
                handleClose(e);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setIsExpanded, handleClose]);

    const handleQueuedSongSelect = useCallback((song: Song) => {
        const idx = draggedSongs.findIndex(s => s.id === song.id);
        if (idx !== -1) {
            play("dragged", idx);
            setForceSongView(true);
        }
    }, [draggedSongs, play]);

    const handleAlbumRecommendationSelect = useCallback((song: Song, src: "album" | "recommended" | "dragged") => {
        if (src === "dragged") {
            addToQueue(song);
            return;
        }

        let idx = -1;
        if (src === "album") {
            idx = fetchedAlbumSongs.findIndex(s => s.id === song.id);
        } else if (src === "recommended") {
            idx = fetchedRecSongs.findIndex(s => s.id === song.id);
        }

        if (idx !== -1) {
            play(src, idx);
            setForceSongView(true);
        }
    }, [fetchedAlbumSongs, fetchedRecSongs, addToQueue, play]);

    useEffect(() => {
        if (draggedSongs.length === 0 && activePage === 1) {
            setActivePage(0);
        }
    }, [draggedSongs.length, activePage]);

    const handleNext = useCallback(() => {
        if (loading || isProcessingNext.current) {
            return;
        }

        isProcessingNext.current = true;
        next();

        setTimeout(() => {
            isProcessingNext.current = false;
        }, 300);
    }, [next, loading]);

    const artistIndex = topArtists.findIndex(a => a.id === currentArtist?.id);

    const previousArtist = () => {
        if (artistIndex > 0) {
            openModal(topArtists[artistIndex - 1], []);
        }
    };

    const nextArtist = () => {
        if (artistIndex < topArtists.length - 1) {
            openModal(topArtists[artistIndex + 1], []);
        }
    };

    const toggleRepeat = useCallback(() => {
        setIsRepeat(prev => !prev);
    }, [setIsRepeat]);

    const handleDownload = useCallback(() => {
        triggerDownload(streamingUrl, currentSong?.name, currentSong?.primaryArtists);
    }, [triggerDownload, streamingUrl, currentSong]);

    if (!isModalOpen || !selectedItem) return null;

    return (
        <>
            {/* Hidden audio element */}
            <audio
                ref={handleAudioRef}
                src={currentSong ? streamingUrl : ""}
                autoPlay
                hidden
            />

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 transition-opacity 
                    ${isExpanded
                        ? "bg-black/50 backdrop-blur pointer-events-auto"
                        : "bg-transparent pointer-events-none"
                    }
                `}
            />

            {/* Modal container */}
            <div className={`fixed inset-0 z-50 flex justify-center pointer-events-none
                ${isExpanded ? "items-center px-2" : "items-end"}
            `}>
                {/* Main modal box */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`pointer-events-auto flex flex-col z-50 ease-in-out overflow-hidden mx-auto
                        ${isExpanded
                            ? "rounded-3xl relative w-[calc(100%-0rem)] max-w-100 sm:max-w-none sm:w-110 md:w-130 px-2 h-140 max-h-[90dvh] md:h-160.25 md:px-0"
                            : "rounded-t-3xl fixed bottom-0 left-0 right-0 w-[calc(100%-1rem)] max-w-100 sm:max-w-none sm:w-110 md:w-130 h-25 pb-[env(safe-area-inset-bottom)] md:relative md:inset-auto"
                        }
                `}>
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `linear-gradient(180deg, ${dynamicBgColor || "#1e1e2f"} 0%, black 100%)`,
                            opacity: `${(isExpanded && isImageLoaded) ? 0.95 : 1}`,
                        }}
                    />

                    {/* -------- HEADER SECTION -------- */}
                    <div className={`z-10 ${isExpanded ? "flex shrink-0 h-10 items-center" : ""}`}>
                        <ModalHeader onToggleExpand={() => setIsExpanded(!isExpanded)} onClose={handleClose} />
                    </div>

                    {/* -------- MIDDLE SECTION -------- */}
                    <div className="relative flex-1 flex flex-col overflow-hidden">
                        {!isExpanded && !isArtistView && (
                            <div className="absolute top-[-0.5px] inset-x-0 z-50 w-full drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                                <ProgressBar
                                    progress={duration > 0 ? currentTime / duration : 0}
                                    onSeek={seek}
                                    duration={duration}
                                    bufferedPercent={bufferedPercent}
                                />
                            </div>
                        )}

                        {/* Active Page Content */}
                        <div className={`flex-1 flex flex-col ${isExpanded ? "overflow-y-auto scrollbar-hide [@media(max-height:600px)]:pb-6" : ""}`}>
                            {activePage === 0 && (
                                <div className={`flex flex-1 flex-col 
                                    ${isExpanded
                                        ? "items-center border-t-2 border-t-zinc-700/10"
                                        : "w-full justify-center px-2 md:px-4"
                                    }
                                `}>
                                    {/* ---- Image & Text row ---- */}
                                    <div className={`flex items-center 
                                        ${isExpanded
                                            ? "flex-col"
                                            : "w-full justify-between gap-2 md:gap-4 my-auto pr-10 md:pr-12"
                                        }
                                    `}>
                                        <div className={`select-none relative my-2 shrink-0 overflow-hidden
                                                ${isExpanded ? "w-80 h-80 md:w-100 md:h-100" : "w-16.25 h-16.25"}
                                                ${isArtistView ? "rounded-full" : (isExpanded ? "rounded-3xl" : "rounded-md")}
                                        `}>

                                            {(!isImageLoaded || imageError || !image) && (
                                                <div className={`absolute inset-0 bg-white/5 animate-pulse z-0
                                                    ${isArtistView ? "rounded-full" : (isExpanded ? "rounded-3xl" : "rounded-md")}
                                                `} />
                                            )}

                                            {image && (
                                                <Image
                                                    key={`${image}-${retryKey}`}
                                                    src={retryKey > 0 ? `${image}?retry=${retryKey}` : image}
                                                    alt={decodeHTMLEntities(title)}
                                                    width={isExpanded ? 400 : 65}
                                                    height={isExpanded ? 400 : 65}
                                                    priority
                                                    fetchPriority="high"
                                                    onLoad={() => {
                                                        setIsImageLoaded(true);
                                                        setImageError(false);
                                                    }}
                                                    onError={() => {
                                                        setImageError(true);
                                                        setIsImageLoaded(true);
                                                    }}
                                                    className={`object-cover w-full h-full relative z-10 transition-opacity
                                                        ${(!isImageLoaded || imageError) ? "opacity-0" : "opacity-100"}
                                                        ${isArtistView
                                                            ? "rounded-full ring-1 ring-white/20 ring-offset-4 ring-offset-black/10"
                                                            : (isExpanded ? "rounded-3xl" : "rounded-md")
                                                        }
                                                    `}
                                                />
                                            )}
                                        </div>

                                        {/* Title & Subtitle */}
                                        <div className={`flex-1 min-w-0 text-center flex flex-col items-center justify-center
                                            ${isExpanded ? "w-full" : ""}
                                        `}>
                                            <div className={`flex flex-col justify-center 
                                                ${isExpanded
                                                    ? "min-h-12.5 w-80 md:w-100 lg:w-100"
                                                    : "min-h-10 text-left w-full"
                                                }
                                            `}>
                                                <h3 className={`font-sans font-bold line-clamp-2
                                                    ${!isExpanded
                                                        ? "leading-tight"
                                                        : isArtistView
                                                            ? "truncate text-3xl"
                                                            : "mx-auto w-full"
                                                    }
                                                `}>
                                                    {decodeHTMLEntities(title)}
                                                </h3>
                                            </div>

                                            {!isArtistView && (
                                                <p className={`font-sans font-normal text-sm text-gray-400 truncate
                                                    ${isExpanded
                                                        ? "mx-auto mb-0 min-h-6 w-80 md:w-100 lg:w-100"
                                                        : "hidden"
                                                    }
                                                `}>
                                                    {subtitle ? decodeHTMLEntities(subtitle) : "\u00A0"}
                                                </p>
                                            )}

                                            {isArtistView && (
                                                <div className={`flex flex-col mt-1 select-none ${isExpanded ? "items-center" : "items-start hidden"}`}>
                                                    {isExpanded && (
                                                        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
                                                            <BadgeCheck strokeWidth={2} className="w-3.5 h-3.5 text-blue-400" />
                                                            <p className="text-[10px] font-sans font-normal text-white/90 tracking-widest uppercase leading-none">
                                                                Verified Artist
                                                            </p>
                                                        </div>
                                                    )}

                                                    <p className={`text-sm font-sans font-normal text-white/50 truncate mt-2
                                                        ${isExpanded
                                                            ? "min-h-6"
                                                            : "text-left"
                                                        }
                                                    `}>
                                                        {formatFollowerCount(followerCount)} Followers
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mini controls (only when collapsed) */}
                                        {!isExpanded && !isArtistView && (
                                            <>
                                                <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                                                    <button
                                                        onClick={togglePlay}
                                                        title={isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
                                                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 shadow-[0_0_15px_rgba(255,255,255,0.3)] transform-gpu cursor-pointer"
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={isLoading ? faCircleNotch : (isPlaying ? faPause : faPlay)}
                                                            spin={isLoading}
                                                            className={`w-4 h-4 ${(!isPlaying && !isLoading) ? "ml-0.5" : ""}`}
                                                        />
                                                    </button>

                                                    <button
                                                        onClick={handleNext}
                                                        title="Next"
                                                        className="w-5 cursor-pointer text-white/90 hover:text-white transition-all duration-200 hover:translate-x-0.5"
                                                    >
                                                        <FontAwesomeIcon icon={faForwardStep} size="lg" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Full controls (only when expanded) */}
                                    {isExpanded && !isArtistView && (
                                        <div className="w-80 md:w-100">
                                            <div>
                                                <ProgressBar
                                                    progress={duration > 0 ? currentTime / duration : 0}
                                                    onSeek={seek}
                                                    duration={duration}
                                                    bufferedPercent={bufferedPercent}
                                                />
                                                <div className="flex justify-between text-xs text-gray-300 select-none">
                                                    <span>{formatTime(currentTime)}</span>
                                                    <span>{formatTime(duration)}</span>
                                                </div>
                                            </div>

                                            <PlayerControls
                                                volume={volume}
                                                isMuted={isMuted}
                                                isPlaying={isPlaying}
                                                isRepeat={isRepeat}
                                                isLoading={isLoading}
                                                isDownloading={isDownloading}
                                                downloadProgress={downloadProgress}
                                                streamingUrl={streamingUrl}
                                                onTogglePlay={togglePlay}
                                                onToggleMute={toggleMute}
                                                onToggleRepeat={toggleRepeat}
                                                onDownloadRequest={handleDownload}
                                            />

                                            <div className="flex justify-start">
                                                <VolumeControl
                                                    volume={volume}
                                                    isMuted={isMuted}
                                                    onVolumeChange={setVolumeLevel}
                                                    onMuteToggle={toggleMute}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Artist Navigation - Enclosed Control Dock */}
                                    {isArtistView && isExpanded && (
                                        <div className="flex justify-center items-center my-1">
                                            <div className="inline-flex w-fit mx-auto items-center gap-8 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-full shadow-sm">
                                                <FontAwesomeIcon
                                                    icon={faChevronLeft}
                                                    onClick={artistIndex > 0 ? previousArtist : undefined}
                                                    title="Previous"
                                                    className={`h-5 w-5 transition-all duration-200 
                                                        ${artistIndex <= 0
                                                            ? "text-white/20 cursor-not-allowed"
                                                            : "text-white/70 hover:text-white cursor-pointer hover:-translate-x-0.5 active:scale-95"
                                                        }
                                                    `}
                                                />

                                                {/* Subtle physical divider line */}
                                                <div className="w-px h-4 bg-white/20 rounded-full" />

                                                <FontAwesomeIcon
                                                    icon={faChevronRight}
                                                    onClick={artistIndex < topArtists.length - 1 ? nextArtist : undefined}
                                                    title="Next"
                                                    className={`h-5 w-5 transition-all duration-200 
                                                        ${artistIndex >= topArtists.length - 1
                                                            ? "text-white/20 cursor-not-allowed"
                                                            : "text-white/70 hover:text-white cursor-pointer hover:translate-x-0.5 active:scale-95"
                                                        }
                                                    `}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activePage === 1 && (
                                <QueuedSongs
                                    draggedSongs={draggedSongs}
                                    onSongSelect={handleQueuedSongSelect}
                                    setDraggedSongs={setDraggedSongs}

                                />
                            )}

                            {activePage === 2 && (
                                <AlbumAndRecommendationSongs
                                    artistName={artistNameForRecommendations}
                                    onSongSelect={handleAlbumRecommendationSelect}
                                    onSongDragged={addToQueue}
                                />
                            )}
                        </div>
                    </div>

                    {/* -------- BOTTOM SECTION (page dots) -------- */}
                    {isExpanded && (
                        <div className="shrink-0 h-4 flex items-center justify-center gap-1 z-10">
                            {[0, 1, 2].filter(i => i !== 1 || draggedSongs.length > 0).map(i => (
                                <button
                                    key={i}
                                    onClick={() => setActivePage(i)}
                                    className="w-6 h-6 flex items-center justify-center group focus:outline-none cursor-pointer"
                                    aria-label={`Go to page ${i + 1}`}
                                >
                                    <div className={`h-2.5 rounded-full  
                                        ${activePage === i
                                            ? "bg-white w-6 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                            : "bg-white/30 w-2.5 group-hover:bg-white/60"
                                        }
                                    `} />
                                </button>
                            ))}

                            <OnboardingTooltipManager id="toggle-sections-tip" />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}