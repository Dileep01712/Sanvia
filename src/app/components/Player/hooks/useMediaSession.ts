import { useEffect } from "react";
import { Song } from "@/lib/songTypes";
import { decodeHTMLEntities, getBestQualityImage } from "@/lib/helpers";

export function useMediaSession(
    currentSong: Song | null,
    overriddenTitle?: string | null,
    overriddenArtist?: string | null
) {
    useEffect(() => {
        if (typeof window === "undefined" || !currentSong || !currentSong.name) return;
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: decodeHTMLEntities(overriddenTitle ? overriddenTitle : "") || decodeHTMLEntities(currentSong.name),
                artist: decodeHTMLEntities(overriddenArtist ? overriddenArtist : "") || decodeHTMLEntities(currentSong.primaryArtists),
                artwork: [{
                    src: getBestQualityImage(currentSong.image),
                    sizes: "500x500",
                    type: "image/png"
                }],
            });
        }
    }, [currentSong, overriddenTitle, overriddenArtist]);
}