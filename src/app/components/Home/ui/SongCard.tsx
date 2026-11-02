"use client";

import { Song } from "@/lib/songTypes";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faCompactDisc } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import {
    decodeHTMLEntities,
    getBestQualityDownload,
    getBestQualityImage,
} from "@/lib/helpers";
import SwipeableCard from "@/app/components/Queue/Swipe/SwipeableCard";
import SongContextMenu from "@/app/components/Queue/ContextMenu/SongContextMenu";
import CollectionContextMenu from "@/app/components/Queue/ContextMenu/CollectionContextMenu";
import { useCardContextMenu } from "@/app/components/Queue/ContextMenu/useCardContextMenu";
import OnboardingTooltipManager from "../../Tooltips/OnboardingTooltipManager";

interface SongCardProps {
    song: Song;
    isAlbum?: boolean;
    onClick?: () => void;
}

export default function SongCard({
    song,
    isAlbum,
    onClick
}: SongCardProps) {
    const isAlbumCard = !!isAlbum || song.type === "album";
    const {
        open: menuOpen,
        close: closeMenu,
        anchorRef: cardRef,
        bind, consumeLongPress
    } = useCardContextMenu(true);

    return (
        <>
            <SwipeableCard
                song={song}
                onClick={() => {
                    if (consumeLongPress()) return;
                    onClick?.();
                }}
                disabled={isAlbumCard}
            >
                <div
                    ref={cardRef}
                    {...bind}
                    className="group w-full min-w-0 cursor-pointer select-none [-webkit-touch-callout:none] rounded-xl transition-all md:duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-zinc-900"
                >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-1">
                        <Image
                            src={getBestQualityImage(song.image)}
                            alt={song.name}
                            width={212}
                            height={214}
                            unoptimized
                            loading="lazy"
                            draggable={false}
                            className="w-full h-full object-cover select-none transition-all md:duration-300 group-hover:brightness-75"
                        />

                        {isAlbum && (
                            <div className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-md pointer-events-none transition-opacity md:duration-300 group-hover:opacity-0">
                                <FontAwesomeIcon icon={faCompactDisc} className="text-white" />
                            </div>
                        )}

                        <Button className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 opacity-0 hover:bg-black/90 group-hover:opacity-100 cursor-pointer">
                            <FontAwesomeIcon icon={faPlay} className="relative h-6 w-6 text-white" />
                        </Button>
                    </div>

                    <h3 className="mb-0.5 truncate px-2.5 text-center font-sans text-base font-semibold text-white/90">
                        {decodeHTMLEntities(song.name)}
                    </h3>

                    <p className="truncate px-2.5 pb-1 rounded-bl-xl rounded-br-xl text-center font-sans text-sm text-gray-400">
                        {decodeHTMLEntities(song.primaryArtists)}
                    </p>
                </div>

                {menuOpen &&
                    (isAlbumCard ? (
                        <CollectionContextMenu
                            kind="album"
                            title={decodeHTMLEntities(song.name)}
                            albumLink={getBestQualityDownload(song.downloadUrl)}
                            anchorRef={cardRef}
                            onClose={closeMenu}
                            onPlay={() => onClick?.()}
                        />
                    ) : (
                        <SongContextMenu
                            song={song}
                            anchorRef={cardRef}
                            onClose={closeMenu}
                            onPlay={() => onClick?.()}
                        />
                    ))}
            </SwipeableCard>

            <OnboardingTooltipManager id="card-more-options-tip" />
        </>
    );
}