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
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.min(1, Math.max(0, percent));

        setLocalProgress(percent);
        onSeek(percent);
    }, [onSeek]);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (e.buttons === 0) {
                setIsDragging(false);
                return;
            }
            if (isDragging) updateProgress(e.clientX);
        };
        const handleUp = () => setIsDragging(false);

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [isDragging, updateProgress]);

    return (
        <div ref={barRef}
            onMouseDown={(e) => {
                if (duration === 0) return;
                e.preventDefault();
                setIsDragging(true);
                updateProgress(e.clientX);
            }}
            className={`relative w-full flex items-center select-none touch-none transition-all
                ${isExpanded ? "h-3" : "h-1"} 
                ${duration === 0 ? "pointer-events-none" : ""}
                ${className || ""}
            `}
        >
            <div className="group inset-x-0 w-full relative cursor-pointer">
                <div className={`absolute top-1/2 inset-x-0 -translate-y-1/2 bg-white/10 rounded-full transition-[height] duration-200
                        ${isExpanded ? "h-1 group-hover:h-2" : "h-0.5 group-hover:h-0.75"}`}
                />

                <div className={`absolute top-1/2 left-0 -translate-y-1/2 bg-white/20 rounded-full transition-[height] duration-200
                    ${isExpanded ? "h-1 group-hover:h-2" : "h-0.5 group-hover:h-0.75"}`}
                    style={{ width: `${bufferedPercent}%` }}
                />

                <div className={`absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-white transition-[height] duration-200
                    ${isExpanded ? "h-1 group-hover:h-2" : "h-0.5 group-hover:h-0.75"}`}
                    style={{ width: `${localProgress * 100}%` }}
                />

                {isExpanded && (
                    <div className="absolute top-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 -translate-y-1/2 -translate-x-1/2 transition hover:scale-125 shadow-md"
                        style={{ left: `${localProgress * 100}%` }}
                    />
                )}
            </div>
        </div>
    );
}