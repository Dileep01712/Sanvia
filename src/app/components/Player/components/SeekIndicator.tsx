"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SeekSide, SeekState } from "../hooks/useSeekIndicator";

function Triangles({ side }: { side: SeekSide }) {
    const points = side === "left" ? "8,0 8,12 0,6" : "0,0 0,12 8,6";

    return (
        <div className="flex items-center gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <motion.svg
                    key={i}
                    viewBox="0 0 8 12"
                    className="h-3.5 w-2.5 fill-white"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (side === "left" ? 2 - i : i) * 0.15,
                    }}
                >
                    <polygon points={points} />
                </motion.svg>
            ))}
        </div>
    );
}

export default function SeekIndicator({ seek }: { seek: SeekState | null }) {
    const label = seek
        ? `${seek.side === "left" ? "\u2212" : "+"}${seek.total} ${seek.total === 1 ? "second" : "seconds"}`
        : "";

    return (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-3xl">
            <AnimatePresence>
                {seek && (
                    <motion.div
                        key="dim"
                        className="absolute inset-0 bg-black/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    />
                )}

                {seek && (
                    <motion.div
                        key={seek.side}
                        className={`absolute inset-y-0 flex w-[40%] sm:w-[35%] items-center justify-center 
                            ${seek.side === "left" ? "left-0" : "right-0"}
                        `}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div
                            className={`absolute inset-0 bg-white/10
                                ${seek.side === "left" ? "rounded-r-[100%]" : "rounded-l-[100%]"}
                            `}
                        />

                        <motion.div
                            key={seek.id}
                            className={`absolute inset-0 bg-white/20 
                                ${seek.side === "left"
                                    ? "origin-left rounded-r-[100%]"
                                    : "origin-right rounded-l-[100%]"
                                }
                            `}
                            initial={{ scaleX: 0.6, opacity: 0.8 }}
                            animate={{ scaleX: 1, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />

                        <div className={`relative flex flex-col items-center gap-1.5 text-white drop-shadow-md
                            ${seek.side === "left" ? "pr-2 md:pr-4" : "pl-2 md:pl-4"}
                        `}>
                            <Triangles side={seek.side} />
                            <span className="text-sm font-semibold tabular-nums md:text-base tracking-wide">
                                {label}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}