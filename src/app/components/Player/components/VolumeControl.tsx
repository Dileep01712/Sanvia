"use client";
import { useRef, useState, useEffect, useCallback } from "react";

interface VolumeControlProps {
    volume: number;
    isMuted: boolean;
    onVolumeChange: (level: number) => void;
    onMuteToggle: () => void;
}

export default function VolumeControl({ volume, isMuted, onVolumeChange }: VolumeControlProps) {
    const barRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localVolume, setLocalVolume] = useState<number>(volume);

    useEffect(() => {
        if (!isDragging) {
            setLocalVolume(volume);
        }
    }, [volume, isDragging]);

    const updateVolume = useCallback((clientX: number) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        let newVol = (clientX - rect.left) / rect.width;
        newVol = Math.min(1, Math.max(0, newVol));

        setLocalVolume(newVol);
        onVolumeChange(newVol);
    }, [onVolumeChange]);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (e.buttons === 0) {
                setIsDragging(false);
                return;
            }
            if (isDragging) updateVolume(e.clientX);
        };
        const handleUp = () => setIsDragging(false);

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [isDragging, updateVolume]);

    const displayVolume = isMuted ? 0 : localVolume;

    return (
        <div className="flex items-center gap-4">
            <div
                ref={barRef}
                className="group relative w-24 h-4 cursor-pointer flex items-center select-none touch-none"
                onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                    updateVolume(e.clientX);
                }}
            >
                <div className="absolute top-1/2 inset-x-0 -translate-y-1/2 h-1 group-hover:h-2 bg-white/10 rounded-full transition-[height] duration-200" />

                <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 group-hover:h-2 rounded-full bg-white transition-[height] duration-200"
                    style={{ width: `${displayVolume * 100}%` }}
                />

                <div className="absolute top-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 -translate-y-1/2 -translate-x-1/2 transition hover:scale-125 shadow-md"
                    style={{ left: `${displayVolume * 100}%` }}
                />
            </div>

            <span className="text-xs text-white select-none w-8 text-right">
                {Math.round(displayVolume * 100)}%
            </span>
        </div>
    );
}