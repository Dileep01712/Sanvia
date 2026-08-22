import { Song } from "@/lib/songTypes";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faCompactDisc } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { decodeHTMLEntities, getBestQualityImage } from "@/lib/helpers";

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
    return (
        <div
            onClick={onClick}
            className="group w-full min-w-0 cursor-pointer rounded-xl transition-all md:duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-zinc-900"
        >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                <Image
                    src={getBestQualityImage(song.image)}
                    alt={song.name}
                    width={212}
                    height={214}
                    unoptimized
                    loading="lazy"
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

            <h3 className="mb-0.5 truncate px-2.5 text-center font-sans text-base font-bold text-white">
                {decodeHTMLEntities(song.name)}
            </h3>

            <p className="truncate px-2.5 pb-1 rounded-bl-xl rounded-br-xl text-center font-sans text-sm font-normal text-gray-400">
                {decodeHTMLEntities(song.primaryArtists)}
            </p>
        </div>
    );
}