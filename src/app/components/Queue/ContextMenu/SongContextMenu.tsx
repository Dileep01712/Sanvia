"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Song } from "@/lib/songTypes";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useDownload } from "../../Player/hooks/useDownload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDownload,
    faForwardStep,
    faPlay,
    faPlus,
    faSpinner,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
    ContextMenuShell,
    InfoDrawer,
    InfoLine,
    InfoRow,
    MENU_ITEM_CLASS,
} from "./contextMenuShared";
import {
    ExtendedSong,
    extractArtistName,
    extractMediaUrl,
    fetchSongMeta,
    getSongInfo,
    useSongMeta,
} from "./useSongMeta";

interface SongContextMenuProps {
    song: Song;
    anchorRef: { current: HTMLElement | null };
    onClose: () => void;
    onPlay: () => void;
    onDownload?: (song: Song) => void;
}

export default function SongContextMenu({
    song,
    anchorRef,
    onClose,
    onPlay,
    onDownload,
}: SongContextMenuProps) {
    const [showInfo, setShowInfo] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const [downloadFailed, setDownloadFailed] = useState(false);

    const isExpanded = usePlayerStore((s) => s.isExpanded);
    const hasCurrentSong = usePlayerStore((s) => !!s.currentSong);
    const isQueued = usePlayerStore((s) => s.queuedSongs.some((q) => q.id === song.id));
    const addToQueue = usePlayerStore((s) => s.addToQueue);
    const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
    const playNext = usePlayerStore((s) => s.playNext);

    const { isDownloading, downloadProgress, triggerDownload, cancelDownload } = useDownload(song.id);

    const metaState = useSongMeta(song as ExtendedSong);
    const info = useMemo(() => getSongInfo(song, metaState), [song, metaState]);

    const wasExpandedRef = useRef(isExpanded);

    useEffect(() => {
        const wasExpanded = wasExpandedRef.current;
        wasExpandedRef.current = isExpanded;

        if (isExpanded && !wasExpanded) {
            onClose();
        }
    }, [isExpanded, onClose]);

    const run = (action: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        action();
        onClose();
    };

    const handleDownloadClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isDownloading) {
            cancelDownload();
            return;
        }
        if (isPreparing) return;

        if (onDownload) {
            onDownload(song);
            onClose();
            return;
        }

        const extSong = song as ExtendedSong;
        let url = metaState.meta?.mediaUrl || extractMediaUrl(extSong);
        let artists = metaState.meta?.artists || extractArtistName(extSong);

        setDownloadFailed(false);

        if (!url) {
            setIsPreparing(true);
            try {
                const meta = await fetchSongMeta(song.id);
                url = meta.mediaUrl;
                artists = meta.artists || artists;
            } catch (err) {
                console.error("[SongContextMenu] Could not load the download link:", err);
                setDownloadFailed(true);
                return;
            } finally {
                setIsPreparing(false);
            }
        }

        try {
            await triggerDownload(url, song.name, artists);
        } catch (err) {
            console.error("[SongContextMenu] Download failed:", err);
            setDownloadFailed(true);
        }
    };

    const items = hasCurrentSong
        ? [
            {
                key: "next",
                label: "Play next",
                icon: faForwardStep,
                action: () => playNext(song),
            },
            isQueued
                ? {
                    key: "remove",
                    label: "Remove from queue",
                    icon: faXmark,
                    action: () => removeFromQueue(song.id),
                }
                : {
                    key: "add",
                    label: "Add to queue",
                    icon: faPlus,
                    action: () => addToQueue(song),
                },
        ]
        : [{ key: "play", label: "Play", icon: faPlay, action: onPlay }];

    return (
        <ContextMenuShell anchorRef={anchorRef} onClose={onClose}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={run(item.action)}
                    className={MENU_ITEM_CLASS}
                >
                    <FontAwesomeIcon icon={item.icon} className="w-4 shrink-0 text-white/70" />
                    <span className="truncate">{item.label}</span>
                </button>
            ))}

            <button
                type="button"
                role="menuitem"
                onClick={handleDownloadClick}
                className={`${MENU_ITEM_CLASS} justify-between`}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FontAwesomeIcon
                        icon={isDownloading || isPreparing ? faSpinner : faDownload}
                        spin={isDownloading || isPreparing}
                        className="w-4 shrink-0 text-white/70"
                    />

                    {isDownloading ? (
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-left leading-snug">
                            <span className="truncate">Downloading</span>
                            <span className="shrink-0 tabular-nums">{downloadProgress}%</span>
                        </div>
                    ) : (
                        <span className="truncate text-left leading-snug">
                            {isPreparing
                                ? "Preparing…"
                                : downloadFailed
                                    ? "Failed"
                                    : "Download"}
                        </span>
                    )}
                </div>

                {isDownloading && (
                    <FontAwesomeIcon
                        icon={faXmark}
                        className="shrink-0 text-sm text-white/70 transition-colors hover:text-white"
                    />
                )}
            </button>

            {info && (
                <InfoDrawer showInfo={showInfo} onToggle={() => setShowInfo((v) => !v)}>
                    <InfoRow label="Song" value={info.name} />
                    <InfoRow label="Artist" value={info.artist} />

                    <div className="h-px bg-white/10" />

                    <div className="space-y-1.5">
                        <InfoLine label="Quality" value={info.quality} />
                        <InfoLine label="Size" value={info.size} />
                        <InfoLine label="Duration" value={info.duration} />
                    </div>
                </InfoDrawer>
            )}
        </ContextMenuShell>
    );
}