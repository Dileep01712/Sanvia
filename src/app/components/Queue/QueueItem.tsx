"use client";

import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
import Image from "next/image";
import { Song } from "@/lib/songTypes";
import { decodeHTMLEntities, getBestQualityImage } from "@/lib/helpers";

const SWIPE_CONFIG = {
    left: {
        threshold: (isMobile: boolean) => (isMobile ? 10 : 100),
        velocity: (isMobile: boolean) => (isMobile ? 100 : 300),
        directionSign: -1,
    },
    right: {
        threshold: (isMobile: boolean) => (isMobile ? 10 : 100),
        velocity: (isMobile: boolean) => (isMobile ? 100 : 300),
        directionSign: 1,
    },
};

const ANIMATION = {
    type: "tween",
    ease: "easeOut",
    duration: 0.2,
} as const;

const EqualizerIcon = () => (
    <>
        <style>{`
            @keyframes eq-stretch {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
            }
            .eq-bar {
            transform-origin: bottom;
            animation: eq-stretch 0.9s ease-in-out infinite;
            filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.8));
            }
        `}</style>

        <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-black/50 flex items-center justify-center gap-1 z-10 pointer-events-none">
            <span className="w-0.75 h-3 bg-white rounded-sm eq-bar" style={{ animationDelay: '0ms' }} />
            <span className="w-0.75 h-5 bg-white rounded-sm eq-bar" style={{ animationDelay: '250ms' }} />
            <span className="w-0.75 h-4 bg-white rounded-sm eq-bar" style={{ animationDelay: '500ms' }} />
        </div>
    </>
);

interface QueueSongItemProps {
    song: Song;
    direction: "left" | "right";
    onComplete: () => void;
    onClick: () => void;
    isHighlighted?: boolean;
    isCurrentSong?: boolean;
}

function QueueSongItem({
    song,
    direction,
    onComplete,
    onClick,
    isHighlighted = false,
    isCurrentSong = false,
}: QueueSongItemProps) {
    const x = useMotionValue(0);
    const hasDragged = useRef(false);
    const config = SWIPE_CONFIG[direction];
    const [windowWidth, setWindowWidth] = useState(0);

    const itemRef = useRef<HTMLLIElement>(null);
    useEffect(() => {
        if (isCurrentSong && itemRef.current) {
            itemRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [isCurrentSong]);

    useEffect(() => {
        const updateWidth = () => setWindowWidth(window.innerWidth);
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const imageUrl = useMemo(() => getBestQualityImage(song.image), [song.image]);
    const decodedName = useMemo(() => decodeHTMLEntities(song.name), [song.name]);
    const decodedArtists = useMemo(
        () =>
            song.artists?.primary?.map((a) => decodeHTMLEntities(a.name)).join(", ") ?? "",
        [song.artists?.primary]
    );

    const handleDragStart = useCallback(() => {
        hasDragged.current = false;
    }, []);

    const handleDrag = useCallback((_: unknown, info: PanInfo) => {
        const isMoving = Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5;
        if (isMoving) hasDragged.current = true;
    }, []);

    const handleDragEnd = useCallback(
        (_: unknown, info: PanInfo) => {
            const offsetX = info.offset.x;
            const velocityX = info.velocity.x;
            const isMobile = windowWidth > 0 && windowWidth < 768;
            const threshold = config.threshold(isMobile);
            const minVelocity = config.velocity(isMobile);

            const isIntentionalSwipe =
                (config.directionSign === -1 && (offsetX < -threshold || velocityX < -minVelocity)) ||
                (config.directionSign === 1 && (offsetX > threshold || velocityX > minVelocity));

            if (isIntentionalSwipe) {
                const target = (config.directionSign === -1 ? -1 : 1) * (windowWidth || 1000);
                animate(x, target, {
                    ...ANIMATION,
                    onComplete: () => {
                        onComplete();
                        animate(x, 0, ANIMATION);
                    },
                });
            } else {
                animate(x, 0, ANIMATION);
            }
        },
        [config, onComplete, x, windowWidth]
    );

    const handleClick = useCallback(() => {
        if (!hasDragged.current) onClick();
    }, [onClick]);

    if (!imageUrl) return null;

    return (
        <motion.li
            ref={itemRef}
            drag="x"
            dragElastic={0.05}
            dragMomentum={false}
            dragConstraints={{
                left: direction === "left" ? -1000 : 0,
                right: direction === "right" ? 1000 : 0
            }}
            style={{
                x,
                willChange: "transform",
                transform: "translateZ(0)",
                touchAction: "pan-y",
            }}
            dragTransition={{ power: 0.3, timeConstant: 150 }}
            // whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "tween", duration: 0.1 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            className={`my-3 flex min-h-17.5 w-80 cursor-pointer items-center justify-between rounded-xl border p-2 transition-colors md:duration-200 sm:w-87.5 md:w-92.5 lg:w-105
                ${isHighlighted
                    ? "border-white/10 bg-white/10 shadow-sm"
                    : "border-transparent hover:bg-white/5"
                }
            `}>
            <div className="flex items-center gap-4 w-full overflow-hidden">
                <div className="relative w-15 h-15 shrink-0 overflow-hidden rounded-md bg-zinc-700">
                    <Image
                        src={imageUrl}
                        alt="Song cover"
                        width={65}
                        height={65}
                        unoptimized
                        loading="lazy"
                        className="object-cover rounded-md pointer-events-none select-none transform-gpu"
                    />
                    {isCurrentSong && <EqualizerIcon />}
                </div>

                <div className="flex flex-col space-y-1 overflow-hidden w-full min-w-0">
                    <h3 className="w-full truncate font-sans font-medium text-white">
                        {decodedName}
                    </h3>
                    <p className="text-sm font-sans font-normal text-white/70 truncate w-full">
                        {decodedArtists}
                    </p>
                </div>
            </div>
        </motion.li>
    );
}

export default memo(QueueSongItem);