"use client";

import { useRef } from "react";
import Image from "next/image";
import { Song } from "@/lib/songs";
import { motion, useMotionValue, animate, PanInfo, MotionValue } from "framer-motion";

export default function RemoveSongsFromQueue({
    song,
    onClick,
    setDraggedSongs,
}: {
    song: Song;
    onClick: () => void;
    setDraggedSongs: React.Dispatch<React.SetStateAction<Song[]>>;
}) {
    const x = useMotionValue(0);
    const hasDragged = useRef(false);

    function decodeHTMLEntities(text: string) {
        const txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }

    const handleDragStart = () => {
        hasDragged.current = false;
    };

    const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
            hasDragged.current = true;
        }
    };

    const handleDragEnd = (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo,
        x: MotionValue<number>,
        songId: string,
        onDragComplete?: () => void
    ) => {
        const offsetX = info.offset.x;
        const velocityX = info.velocity.x + 500;
        const isMobile = window.innerWidth < 768;
        const threshold = isMobile ? 10 : 100;
        const minVelocity = isMobile ? 100 : 300;

        const shouldSlideLeft = offsetX > threshold || velocityX > minVelocity;

        if (shouldSlideLeft) {
            // Animate off screen
            animate(x, window.innerWidth, {
                type: "tween",
                ease: "easeOut",
                duration: 0.2,
                onComplete: () => {
                    setDraggedSongs(prev => prev.filter(song => song.id !== songId));

                    if (onDragComplete) onDragComplete();

                    // Reset to original position
                    animate(x, 0, {
                        type: "tween",
                        ease: "easeOut",
                        duration: 0.2,
                    });
                }
            });
        } else {
            animate(x, 0, {
                type: "tween",
                ease: "easeOut",
                duration: 0.2,
            });
        }
    };

    const handleClick = () => {
        if (!hasDragged.current) {
            onClick();
        }
    };

    const image =
        typeof song.image === "string"
            ? song.image
            : Array.isArray(song.image)
                ? (song.image as { url: string }[]).at(-1)?.url ?? ""
                : "";

    if (!image) return null;

    return (
        <motion.li drag="x" dragElastic={0.2} dragConstraints={{ left: 0, right: 0 }} style={{ x }} dragTransition={{ power: 0.3, timeConstant: 150 }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }} onDragStart={handleDragStart} onDrag={handleDrag} onDragEnd={(e, info) => handleDragEnd(e, info, x, song.id)} onClick={handleClick} className={`flex items-center gap-3 min-h-20 p-2 md:w-[400px] md-range:w-[370px] sm-range:w-[350px] w-[310px] justify-center group hover:bg-zinc-700 rounded-md cursor-pointer my-3 border`} >
            <Image src={image} alt="Picture" width={60} height={60} loading="lazy" className="object-cover rounded-md select-none" />
            <div className="flex flex-col space-y-1 overflow-hidden w-full">
                <h3 className="w-full line-clamp-2 leading-tight font-Lato">{decodeHTMLEntities(song.name)}</h3>
                <p className="text-xs font-Lato text-gray-400 truncate w-full">
                    {song.artists?.primary?.map((a) => a.name).join(", ") ?? ""}
                </p>
            </div>
        </motion.li>
    );
}
