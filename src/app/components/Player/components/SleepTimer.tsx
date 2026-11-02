"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon } from "@fortawesome/free-solid-svg-icons";
import type { SleepMode } from "../hooks/useSleepTimer";

const PRESETS = [15, 30, 45, 60];

const CHIP =
    "h-8 cursor-pointer select-none rounded-full border border-white/15 bg-white/10 px-2.5 md:px-3 text-xs font-medium text-white/90 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50";

interface SleepTimerProps {
    mode: SleepMode;
    label: string;
    onStart: (minutes: number) => void;
    onStartAtSongEnd: () => void;
    onExtend: (minutes: number) => void;
    onCancel: () => void;
}

export default function SleepTimer({
    mode,
    label,
    onStart,
    onStartAtSongEnd,
    onExtend,
    onCancel,
}: SleepTimerProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const active = mode !== "off";

    useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            if (open && rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

            if (e.key.toLowerCase() === "t" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setOpen((o) => !o);
            }

            else if (e.key === "Escape" && open) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const pick = (action: () => void) => () => {
        action();
        setOpen(false);
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={active ? `Sleep timer, ${label}` : "Sleep timer"}
                aria-expanded={open}
                title="Sleep timer (T)"
                className={`flex h-5 cursor-pointer select-none items-center gap-2 px-px transition-colors 
                    ${active ? "text-white" : "text-white/50 hover:text-white"}
                `}
            >
                <FontAwesomeIcon icon={faMoon} className="text-lg" />
                {active && (
                    <span className="text-sm tabular-nums">{label}</span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.1 } }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 z-30 mb-2 w-max max-w-[calc(100vw-2rem)] origin-bottom-left rounded-2xl border border-white/15 bg-black/60 p-2 shadow-lg backdrop-blur-xl"
                    >
                        <p className="select-none px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                            Sleep timer
                        </p>

                        {active ? (
                            <div className="flex gap-2">
                                {mode === "timer" && (
                                    <button
                                        type="button"
                                        onClick={() => onExtend(5)}
                                        className={CHIP}
                                    >
                                        +5 min
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={pick(onCancel)}
                                    className={CHIP}
                                >
                                    Turn off
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={pick(() => onStart(m))}
                                        className={CHIP}
                                    >
                                        {m}m
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={pick(onStartAtSongEnd)}
                                    className={CHIP}
                                >
                                    End of song
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}