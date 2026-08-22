import { useEffect } from "react";
import { Song } from "@/lib/songTypes";
import { decodeHTMLEntities, getBestQualityImage } from "@/lib/helpers";

export function useMediaSession(
    currentSong: Song | null,
    resolvedTitle?: string | null,
    resolvedArtist?: string | null,
) {
    useEffect(() => {
        if (typeof window === "undefined" || !currentSong || !currentSong.name) return;
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: decodeHTMLEntities(resolvedTitle ? resolvedTitle : "") || decodeHTMLEntities(currentSong.name),
                artist: decodeHTMLEntities(resolvedArtist ? resolvedArtist : "") || decodeHTMLEntities(currentSong.primaryArtists),
                artwork: [{
                    src: getBestQualityImage(currentSong.image),
                    sizes: "500x500",
                    type: "image/png"
                }],
            });
        }
    }, [currentSong, resolvedTitle, resolvedArtist]);
}