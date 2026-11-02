"use client";

import { memo, useCallback, useRef, useState, type ReactNode } from "react";
import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useTransform,
    type PanInfo,
} from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faPlay, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Song } from "@/lib/songTypes";
import { QUEUE_LIMIT, usePlayerStore } from "@/store/usePlayerStore";

const MAX_TRAVEL = 72;
const THRESHOLD = 56;
const FLICK_VELOCITY = 500;
const RETURN = { type: "spring", stiffness: 500, damping: 36 } as const;

interface SwipeableCardProps {
    song: Song;
    onClick?: () => void;
    disabled?: boolean;
    children: ReactNode;
}

function SwipeableCard({
    song,
    onClick,
    disabled = false,
    children,
}: SwipeableCardProps) {
    const x = useMotionValue(0);
    const hasDragged = useRef(false);
    const [dragging, setDragging] = useState(false);

    const addToQueue = usePlayerStore((s) => s.addToQueue);
    const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
    const hasCurrentSong = usePlayerStore((s) => !!s.currentSong);
    const isQueued = usePlayerStore((s) =>
        s.queuedSongs.some((q) => q.id === song.id)
    );

    const isFull = usePlayerStore((s) => s.queuedSongs.length >= QUEUE_LIMIT);
    const addIcon = !hasCurrentSong ? faPlay : isFull && !isQueued ? faBan : faPlus;

    const addOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0]);
    const addScale = useTransform(x, [-THRESHOLD, 0], [1, 0.6]);
    const removeOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
    const removeScale = useTransform(x, [0, THRESHOLD], [0.6, 1]);

    const handleDragStart = useCallback(() => {
        setDragging(true);
    }, []);

    const handleDrag = useCallback((_: unknown, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 5) hasDragged.current = true;
    }, []);

    const handleDragEnd = useCallback(
        (_: unknown, info: PanInfo) => {
            const dx = info.offset.x;
            const vx = info.velocity.x;

            const passed = (sign: 1 | -1) => {
                const dist = dx * sign;
                return (
                    dist > THRESHOLD ||
                    (dist > THRESHOLD / 2 && vx * sign > FLICK_VELOCITY)
                );
            };

            if (passed(-1)) {
                if (hasCurrentSong) addToQueue(song);
                else onClick?.();
            } else if (passed(1) && isQueued) {
                removeFromQueue(song.id);
            }

            animate(x, 0, { ...RETURN, onComplete: () => setDragging(false) });
        },
        [addToQueue, removeFromQueue, hasCurrentSong, onClick, song, isQueued, x]
    );

    const handleClick = useCallback(() => {
        if (hasDragged.current) {
            hasDragged.current = false;
            return;
        }
        onClick?.();
    }, [onClick]);

    if (disabled) {
        return (
            <div className="w-full min-w-0" onClick={onClick}>
                {children}
            </div>
        );
    }

    return (
        <div className="relative w-full min-w-0">
            <div
                className={`pointer-events-none absolute inset-0 rounded-xl border border-white/20 
                    ${dragging ? "opacity-100 transition-opacity duration-150" : "opacity-0"}
                `}
            />

            <motion.div
                drag="x"
                dragDirectionLock
                dragMomentum={false}
                dragElastic={0.1}
                dragConstraints={{ left: -MAX_TRAVEL, right: isQueued ? MAX_TRAVEL : 0 }}
                whileDrag={{ zIndex: 20 }}
                style={{ x, touchAction: "pan-y" }}
                onPointerDown={() => {
                    hasDragged.current = false;
                }}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                className="relative w-full min-w-0 rounded-xl"
            >
                {children}

                <motion.div
                    style={{ opacity: addOpacity }}
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 flex aspect-square items-center justify-center rounded-xl bg-black/50 backdrop-blur-[2px]"
                >
                    <motion.span
                        style={{ scale: addScale }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15"
                    >
                        <FontAwesomeIcon icon={addIcon} className="text-white" />
                    </motion.span>
                </motion.div>

                {isQueued && (
                    <motion.div
                        style={{ opacity: removeOpacity }}
                        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex aspect-square items-center justify-center rounded-xl bg-black/50 backdrop-blur-[2px]"
                    >
                        <motion.span
                            style={{ scale: removeScale }}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15"
                        >
                            <FontAwesomeIcon icon={faXmark} className="text-white" />
                        </motion.span>
                    </motion.div>
                )}

                <AnimatePresence>
                    {isQueued && (
                        <motion.div
                            key="queued-badge"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="pointer-events-none absolute right-1 top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/40 shadow-md backdrop-blur-md"
                        >
                            <FontAwesomeIcon icon={faCheck} className="text-base text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default memo(SwipeableCard);