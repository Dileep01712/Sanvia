"use client";

import Image from "next/image";
import { Artist } from "@/lib/songTypes";
import { formatFollowerCount, decodeHTMLEntities } from "@/lib/helpers";
import CollectionContextMenu from "@/app/components/Queue/ContextMenu/CollectionContextMenu";
import { useCardContextMenu } from "@/app/components/Queue/ContextMenu/useCardContextMenu";
import OnboardingTooltipManager from "../../Tooltips/OnboardingTooltipManager";

interface ArtistCardProps {
    artist: Artist;
    onClick?: () => void;
}
export default function ArtistCard({
    artist,
    onClick
}: ArtistCardProps) {
    const { open: menuOpen, close: closeMenu, anchorRef: cardRef, bind, consumeLongPress } =
        useCardContextMenu(true);
    const artistId = (artist as Artist & { id?: string | number }).id;

    return (
        <>
            <div
                ref={cardRef}
                {...bind}
                onClick={() => {
                    if (consumeLongPress()) return;
                    onClick?.();
                }}
                className="group mx-auto w-full min-w-0 cursor-pointer select-none [-webkit-touch-callout:none] rounded-xl"
            >
                <div className="relative w-full aspect-square overflow-hidden rounded-full">
                    <Image
                        src={artist.image}
                        alt={artist.name}
                        width={212}
                        height={212}
                        unoptimized
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full select-none rounded-full object-cover transition-transform md:duration-300 ease-in-out group-hover:scale-105"
                    />
                </div>

                <h3 className="mb-0.5 truncate px-2.5 text-center font-sans text-base font-semibold text-white/70">
                    {decodeHTMLEntities(artist.name)}
                </h3>

                <p className="select-none truncate px-2.5 pb-1 rounded-bl-xl rounded-br-xl text-center font-sans text-sm text-gray-400">
                    {formatFollowerCount(artist.follower_count)} Followers
                </p>
            </div>

            {menuOpen && (
                <CollectionContextMenu
                    kind="artist"
                    title={decodeHTMLEntities(artist.name)}
                    artistId={artistId !== undefined ? String(artistId) : undefined}
                    anchorRef={cardRef}
                    onClose={closeMenu}
                    onPlay={() => onClick?.()}
                />
            )}

            <OnboardingTooltipManager id="card-more-options-tip" />
        </>
    );
}