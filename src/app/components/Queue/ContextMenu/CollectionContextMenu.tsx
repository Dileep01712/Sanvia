"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faForwardStep,
    faPlay,
    faPlus,
    faUser,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { usePlayerStore } from "@/store/usePlayerStore";
import { decodeHTMLEntities } from "@/lib/helpers";
import {
    ContextMenuShell,
    InfoDrawer,
    InfoLine,
    InfoRow,
    MENU_ITEM_CLASS,
} from "./contextMenuShared";
import { CollectionKind, useCollectionData } from "./useCollectionData";

export type { CollectionKind };

interface CollectionContextMenuProps {
    kind: CollectionKind;
    title: string;
    albumLink?: string;
    artistId?: string;
    anchorRef: { current: HTMLElement | null };
    onClose: () => void;
    onPlay: () => void;
}

export default function CollectionContextMenu({
    kind,
    title,
    albumLink,
    artistId,
    anchorRef,
    onClose,
    onPlay,
}: CollectionContextMenuProps) {
    const [showInfo, setShowInfo] = useState(false);

    const state = useCollectionData(kind, kind === "album" ? albumLink : artistId);
    const data = state.status === "ready" ? state.data : null;
    const songs = data?.songs ?? [];
    const hasDetails = !!data && (!!data.artists || data.meta.length > 0);

    const hasCurrentSong = usePlayerStore((s) => !!s.currentSong);
    const isExpanded = usePlayerStore((s) => s.isExpanded);
    const addToQueue = usePlayerStore((s) => s.addToQueue);
    const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
    const playNext = usePlayerStore((s) => s.playNext);
    const openModal = usePlayerStore((s) => s.openModal);
    const queuedSongs = usePlayerStore((s) => s.queuedSongs);
    const currentId = usePlayerStore((s) => s.currentSong?.id);

    useEffect(() => {
        if (isExpanded) onClose();
    }, [isExpanded, onClose]);

    const run = (action: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        action();
        onClose();
    };

    const canQueue = songs.length > 0;

    const queuedIds = new Set(queuedSongs.map((q) => q.id));
    const others = songs.filter((s) => s.id !== currentId);
    const queued = others.filter((s) => queuedIds.has(s.id));
    const hasMissing = others.length > queued.length;

    const items = hasCurrentSong
        ? [
            {
                key: "next",
                label: "Play next",
                icon: faForwardStep,
                disabled: !canQueue,
                action: () => [...songs].reverse().forEach((s) => playNext(s)),
            },
            ...(!canQueue || hasMissing
                ? [
                    {
                        key: "add",
                        label: "Add to queue",
                        icon: faPlus,
                        disabled: !canQueue,
                        action: () => songs.forEach((s) => addToQueue(s)),
                    },
                ]
                : []),
            ...(queued.length > 0
                ? [
                    {
                        key: "remove",
                        label: "Remove from queue",
                        icon: faXmark,
                        disabled: false,
                        action: () => queued.forEach((s) => removeFromQueue(s.id)),
                    },
                ]
                : []),
        ]
        : kind === "artist"
            ? [
                {
                    key: "play",
                    label: "Play top songs",
                    icon: faPlay,
                    disabled: !canQueue,
                    action: () => {
                        const [first, ...rest] = songs;
                        if (!first) return;
                        openModal(first, [first]);
                        [...rest].reverse().forEach((s) => playNext(s));
                    },
                },
                {
                    key: "open",
                    label: "Open artist",
                    icon: faUser,
                    disabled: false,
                    action: onPlay,
                },
            ]
            : [
                {
                    key: "play",
                    label: "Play album",
                    icon: faPlay,
                    disabled: false,
                    action: onPlay,
                },
            ];

    return (
        <ContextMenuShell anchorRef={anchorRef} onClose={onClose}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={run(item.action)}
                    className={MENU_ITEM_CLASS}
                >
                    <FontAwesomeIcon icon={item.icon} className="w-4 shrink-0 text-white/70" />
                    <span className="leading-snug text-left">{item.label}</span>
                </button>
            ))}

            <InfoDrawer showInfo={showInfo} onToggle={() => setShowInfo((v) => !v)}>
                <InfoRow
                    label={kind === "album" ? "Album" : "Artist"}
                    value={decodeHTMLEntities(title)}
                />
                {data?.artists && <InfoRow label="Artist" value={data.artists} />}

                <div className="h-px bg-white/10" />

                {state.status === "loading" ? (
                    <p className="text-xs text-white/50">Loading...</p>
                ) : !hasDetails ? (
                    <p className="text-xs text-white/50">Details unavailable</p>
                ) : (
                    data.meta.length > 0 && (
                        <div className="space-y-1.5">
                            {data.meta.map((row) => (
                                <InfoLine key={row.label} label={row.label} value={row.value} />
                            ))}
                        </div>
                    )
                )}
            </InfoDrawer>
        </ContextMenuShell>
    );
}