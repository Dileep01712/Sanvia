"use client";

import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
import Image from "next/image";
import { Song } from "@/lib/songTypes";
import { decodeHTMLEntities, getBestQualityImage } from "@/lib/helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import SongContextMenu from "./ContextMenu/SongContextMenu";
import { useCardContextMenu } from "./ContextMenu/useCardContextMenu";

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

interface QueueItemProps {
    song: Song;
    direction: "left" | "right";
    onComplete: () => void;
    onClick: () => void;
    isQueued?: boolean;
    isCurrentSong?: boolean;
    swipeDisabled?: boolean;
}

function QueueItem({
    song,
    direction,
    onComplete,
    onClick,
    isQueued = false,
    isCurrentSong = false,
    swipeDisabled = false,
}: QueueItemProps) {
    const x = useMotionValue(0);
    const hasDragged = useRef(false);
    const config = SWIPE_CONFIG[direction];
    const [windowWidth, setWindowWidth] = useState(0);

    const itemRef = useRef<HTMLLIElement>(null);

    const menuEnabled = direction === "left";
    const { open: menuOpen, close: closeMenu, show: showMenu, bind, consumeLongPress } = useCardContextMenu(menuEnabled);

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
    const decodedArtists = useMemo(() => {
        const fromList = song.artists?.primary
            ?.map((a) => decodeHTMLEntities(a.name))
            .join(", ");
        return fromList || decodeHTMLEntities(song.primaryArtists ?? "");
    }, [song.artists?.primary, song.primaryArtists]);

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
            setTimeout(() => { hasDragged.current = false; }, 0);
        }, [config, onComplete, x, windowWidth]
    );

    const handleClick = useCallback(() => {
        if (consumeLongPress()) return;
        if (!hasDragged.current) onClick();
    }, [onClick, consumeLongPress]);

    if (!imageUrl) return null;

    return (
        <>
            <motion.li
                ref={itemRef}
                drag={swipeDisabled ? false : "x"}
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
                whileTap={{ scale: 0.98 }}
                transition={{ type: "tween", duration: 0.1 }}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                {...bind}
                role="button"
                tabIndex={0}
                className={`group/item relative my-3 flex min-h-17.5 w-80 cursor-pointer select-none [-webkit-touch-callout:none] items-center justify-between rounded-xl border p-2 sm:w-87.5 md:w-92.5 lg:w-105 transition-all ease-in-out md:duration-100 outline-none
                    ${direction === "right"
                        ? "group-data-[editing=true]/row:pr-9 group-data-[handle=true]/row:group-hover/row:pr-9"
                        : ""
                    }
                    ${swipeDisabled ? "" : "md:hover:scale-105"}
                    ${isQueued
                        ? "border-white/10 bg-white/10 shadow-sm"
                        : "border-transparent hover:bg-white/5"
                    }
                `}>

                <div className="flex flex-1 min-w-0 items-center gap-4 overflow-hidden">
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

                    <div className={`flex flex-1 min-w-0 flex-col space-y-1 overflow-hidden transition-all duration-200 ease-in-out 
                        ${menuEnabled ? "pr-8 md:pr-0 md:group-hover/item:pr-8" : ""}
                    `}>
                        <h3 className="truncate font-sans font-medium text-white">
                            {decodedName}
                        </h3>
                        <p className="truncate font-sans text-sm font-normal text-white/70">
                            {decodedArtists}
                        </p>
                    </div>
                </div>

                {menuEnabled && (
                    <button
                        type="button"
                        aria-label="More options"
                        onPointerDownCapture={(e) => {
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            showMenu();
                        }}
                        className={`absolute right-1 top-1/2 z-10 flex h-10 w-8 -translate-y-1/2 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-opacity duration-150 hover:text-white focus-visible:opacity-100 outline-none
                            ${menuOpen
                                ? "opacity-100 pointer-events-auto"
                                : "pointer-events-none opacity-0 md:group-hover/item:pointer-events-auto md:group-hover/item:opacity-100"
                            }
                        `}
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                    </button>
                )}
            </motion.li>

            {menuOpen && (
                <SongContextMenu
                    song={song}
                    anchorRef={itemRef}
                    onClose={closeMenu}
                    onPlay={onClick}
                />
            )}
        </>
    );
}

export default memo(QueueItem);