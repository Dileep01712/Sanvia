"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import { useRef, useState, useEffect, useCallback } from "react";

interface ProgressBarProps {
    progress: number;
    onSeek: (percent: number) => void;
    className?: string;
    duration?: number;
    bufferedPercent: number;
}

export default function ProgressBar({
    progress,
    onSeek,
    className,
    duration = 1,
    bufferedPercent = 0,
}: ProgressBarProps) {
    const isExpanded = usePlayerStore((state) => state.isExpanded);

    const barRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(progress);

    useEffect(() => {
        if (!isDragging && duration > 0) {
            setLocalProgress(progress);
        }
    }, [progress, isDragging, duration]);

    const updateProgress = useCallback((clientX: number) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

        setLocalProgress(percent);
        onSeek(percent);
    }, [onSeek]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (duration === 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        updateProgress(e.clientX);
    }, [duration, updateProgress]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        updateProgress(e.clientX);
    }, [updateProgress]);

    const endDrag = useCallback(() => setIsDragging(false), []);

    const trackHeight = isExpanded
        ? isDragging ? "h-2" : "h-1 group-hover:h-2"
        : "h-0.5 group-hover:h-0.75";

    return (
        <div
            className={`relative w-full flex items-center select-none transition-all
                ${isExpanded ? "h-3" : "h-1"}
                ${duration === 0 ? "pointer-events-none" : ""}
                ${className || ""}
            `}
        >
            <div
                ref={barRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                className={`group absolute inset-x-0 cursor-pointer touch-none ${isExpanded ? "-inset-y-2.5 md:inset-y-0" : "inset-y-0"}`}
            >
                <div className={`absolute top-1/2 inset-x-0 -translate-y-1/2 bg-white/10 rounded-full transition-[height] duration-200 ${trackHeight}`} />

                <div
                    className={`absolute top-1/2 left-0 -translate-y-1/2 bg-white/20 rounded-full transition-[height] duration-200 ${trackHeight}`}
                    style={{ width: `${bufferedPercent}%` }}
                />

                <div
                    className={`absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-white transition-[height] duration-200 ${trackHeight}`}
                    style={{ width: `${localProgress * 100}%` }}
                />

                {isExpanded && (
                    <div
                        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition 
                            ${isDragging
                                ? "scale-125 opacity-100"
                                : "opacity-0 group-hover:opacity-100 hover:scale-125"
                            }
                        `}
                        style={{ left: `${localProgress * 100}%` }}
                    />
                )}
            </div>
        </div>
    );
}