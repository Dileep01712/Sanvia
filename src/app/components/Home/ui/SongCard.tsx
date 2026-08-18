import { Song } from "@/lib/songTypes";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { decodeHTMLEntities, getBestQualityImage } from "@/lib/helpers";

export default function SongCard({
    song,
    onClick
}: {
    song: Song;
    onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className="group w-full min-w-0 cursor-pointer rounded-xl transition-all md:duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-zinc-900"
        >
            <div className="relative">
                <Image
                    src={getBestQualityImage(song.image)}
                    alt={song.name}
                    width={212}
                    height={214}
                    unoptimized
                    loading="lazy"
                    className="w-full aspect-square h-auto select-none rounded-xl object-cover pb-0.5 text-center group-hover:brightness-75"
                />

                <Button className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 opacity-0 hover:bg-black/90 group-hover:opacity-100 [&_svg]:text-white cursor-pointer">
                    <FontAwesomeIcon icon={faPlay} className="relative h-6 w-6 text-white" />
                </Button>
            </div>

            <h3 className="mb-0.5 truncate px-2.5 text-center font-sans text-base font-bold text-white">
                {decodeHTMLEntities(song.name)}
            </h3>

            <p className="truncate px-2.5 pb-2.5 text-center font-sans text-sm font-normal text-gray-400">
                {decodeHTMLEntities(song.primaryArtists)}
            </p>
        </div>
    );
}