import Image from "next/image";
import { Artist } from "@/lib/songTypes";
import { formatFollowerCount, decodeHTMLEntities } from "@/lib/helpers";

interface ArtistCardProps {
    artist: Artist;
    onClick?: () => void;
}
export default function ArtistCard({
    artist,
    onClick
}: ArtistCardProps) {
    return (
        <div onClick={onClick} className="group mx-auto w-full min-w-0 cursor-pointer rounded-xl">
            <div className="relative w-full aspect-square overflow-hidden rounded-full">
                <Image
                    src={artist.image}
                    alt={artist.name}
                    width={212}
                    height={212}
                    unoptimized
                    loading="lazy"
                    className="h-full w-full select-none rounded-full object-cover transition-transform md:duration-300 ease-in-out group-hover:scale-105"
                />
            </div>

            <h3 className="mb-0.5 px-2.5 text-center font-sans text-base font-bold text-white/70 line-clamp-1">
                {decodeHTMLEntities(artist.name)}
            </h3>

            <p className="select-none truncate px-2.5 pb-1 rounded-bl-xl rounded-br-xl text-center font-sans text-xs font-normal text-gray-400">
                {formatFollowerCount(artist.follower_count)} Followers
            </p>
        </div>
    );
}