"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Song } from "@/lib/songTypes";
import QueueSwipeToRemove from "./Swipe/QueueSwipeToRemove";
import SortableQueueRow from "./SortableQueueRow";
import OnboardingTooltipManager from "../Tooltips/OnboardingTooltipManager";
import { usePlayerStore } from "@/store/usePlayerStore";

const CONFIRM_WINDOW_MS = 5000;
const MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

const FADE = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0 } },
    transition: { duration: 0.12 },
};

const ACTION_BUTTON =
    "select-none rounded-full border border-white px-3 py-0.75 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40";

const DONE_BUTTON =
    "cursor-pointer select-none rounded-full border border-white px-3 py-0.75 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60";

const CONFIRM_BUTTON =
    "select-none rounded-full border border-white px-3 py-0.75 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-200/60";

interface QueueListProps {
    queuedSongs: Song[];
    onSongSelect: (song: Song, source: "recommended" | "album" | "queued") => void;
    setQueuedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}

export default function QueueList({
    queuedSongs,
    onSongSelect,
    setQueuedSongs,
}: QueueListProps) {
    const isExpanded = usePlayerStore((state) => state.isExpanded);
    const currentSong = usePlayerStore((state) => state.currentSong);

    const [editing, setEditing] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
    );

    const songIds = useMemo(() => queuedSongs.map((s) => s.id), [queuedSongs]);

    const upcomingCount = useMemo(
        () => queuedSongs.filter((s) => s.id !== currentSong?.id).length,
        [queuedSongs, currentSong?.id]
    );

    const canReorder = upcomingCount >= 2;
    const isEditing = editing && isExpanded && canReorder;

    useEffect(() => {
        if (!isExpanded || !canReorder) setEditing(false);
    }, [isExpanded, canReorder]);

    useEffect(() => {
        if (!isEditing) setConfirmClear(false);
    }, [isEditing]);

    useEffect(() => {
        if (!confirmClear) return;
        const t = setTimeout(() => setConfirmClear(false), CONFIRM_WINDOW_MS);
        return () => clearTimeout(t);
    }, [confirmClear]);

    const handleSongSelect = useCallback(
        (song: Song) => {
            onSongSelect(song, "queued");
        },
        [onSongSelect]
    );

    const handleClear = useCallback(() => {
        if (!confirmClear) {
            setConfirmClear(true);
            return;
        }
        setConfirmClear(false);
        setQueuedSongs((prev) => prev.filter((s) => s.id === currentSong?.id));
    }, [confirmClear, currentSong?.id, setQueuedSongs]);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setQueuedSongs((prev) => {
                const from = prev.findIndex((s) => s.id === active.id);
                const to = prev.findIndex((s) => s.id === over.id);
                if (from === -1 || to === -1) return prev;
                return arrayMove(prev, from, to);
            });
        },
        [setQueuedSongs]
    );

    const showDone = isEditing;
    const showEdit = isExpanded && !isEditing && canReorder;

    return (
        <div className="grid grid-flow-row justify-items-center">
            <div className={`grid min-h-6 grid-cols-[1fr_auto_1fr] items-center gap-2 [@media(min-width:360px)_and_(max-width:420px)]:w-[clamp(0rem,73vw,24rem)] [@media(max-width:640px)]:w-80 sm:w-87 md:w-90 lg:w-105 ${isExpanded ? "my-4 w-80" : "mt-11 w-65"}`}>
                <div className="flex justify-start">
                    <AnimatePresence mode="wait" initial={false}>
                        {isEditing ? (
                            <motion.button
                                key="clear"
                                type="button"
                                onClick={handleClear}
                                {...FADE}
                                className={`text-white/90 hover:text-white cursor-pointer ${confirmClear ? CONFIRM_BUTTON : ACTION_BUTTON}`}
                            >
                                {confirmClear ? "Clear all?" : "Clear"}
                            </motion.button>
                        ) : upcomingCount > 0 ? (
                            <motion.span
                                key="count"
                                {...FADE}
                                className={`text-white ${ACTION_BUTTON}`}
                            >
                                {upcomingCount} {upcomingCount === 1 ? "Song" : "Songs"}
                            </motion.span>
                        ) : null}
                    </AnimatePresence>
                </div>

                <h1 className="min-w-0 select-none truncate text-center font-display font-bold uppercase drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)]">
                    Up Next
                </h1>

                <div className="flex justify-end">
                    <AnimatePresence mode="wait" initial={false}>
                        {showDone && (
                            <motion.button
                                key="done"
                                type="button"
                                onClick={() => setEditing(false)}
                                {...FADE}
                                className={DONE_BUTTON}
                            >
                                Done
                            </motion.button>
                        )}
                        {showEdit && (
                            <motion.button
                                key="edit"
                                type="button"
                                onClick={() => setEditing(true)}
                                {...FADE}
                                className={`text-white/90 hover:text-white cursor-pointer ${ACTION_BUTTON}`}
                            >
                                Edit
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className={`allow-scroll scrollbar-hide min-h-17.5 w-80 justify-items-center overflow-y-auto rounded-lg sm:w-95 md:w-100 lg:w-117.5
                ${isExpanded
                    ? "pb-1.5 sm:pb-1.5 md:pb-1 lg:pb-1 h-110.5 sm:h-110.5 md:h-131 lg:h-131"
                    : "hidden"
                }
            `}>
                {queuedSongs.length > 0 && (
                    <OnboardingTooltipManager id="swipe-to-remove-tip" />
                )}

                <DndContext
                    id="up-next-dnd"
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={MODIFIERS}
                    onDragStart={() => navigator.vibrate?.(12)}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={songIds} strategy={verticalListSortingStrategy}>
                        <div>
                            {queuedSongs.map((song) => (
                                <SortableQueueRow
                                    key={song.id}
                                    id={song.id}
                                    editing={isEditing}
                                    disabled={song.id === currentSong?.id || !canReorder}
                                >
                                    {(isDragging) => (
                                        <QueueSwipeToRemove
                                            song={song}
                                            isCurrentSong={currentSong?.id === song.id}
                                            onClick={() => handleSongSelect(song)}
                                            setQueuedSongs={setQueuedSongs}
                                            swipeDisabled={isDragging}
                                        />
                                    )}
                                </SortableQueueRow>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}