import { useMemo } from "react";
import { decodeHTMLEntities } from "@/lib/helpers";
import { usePlayerStore } from "@/store/usePlayerStore";

interface SectionHeadingProps {
    artistName?: string;
}

export default function SectionHeading({
    artistName,
}: SectionHeadingProps) {
    const loading = usePlayerStore((state) => state.loading);
    const contentType = usePlayerStore((state) => state.contentType);
    const recommendedSongsLength = usePlayerStore((state) => state.recommendedSongs.length);
    const albumSongsLength = usePlayerStore((state) => state.albumSongs.length);

    const firstArtist = useMemo(
        () => artistName?.split(",")[0]?.trim() || "",
        [artistName]
    );

    const actualLength = useMemo(() => {
        if (contentType === "album") return albumSongsLength;
        if (contentType === "recommended" || contentType === "artist") {
            return recommendedSongsLength;
        }
    }, [contentType, albumSongsLength, recommendedSongsLength]);

    const loadingTexts: Record<string, string> = {
        album: "Loading album tracks...",
        recommended: "Finding suggestions for you...",
        artist: `Loading ${decodeHTMLEntities(firstArtist)}'s tracks...`,
        default: "Loading...",
    };

    const headingTexts: Record<string, string> = {
        album: "Album Songs",
        recommended: "You Might Also Like",
        artist: `${decodeHTMLEntities(firstArtist)}'s Tracks`,
    };

    const emptyTexts: Record<string, string> = {
        album: "No album tracks available.",
        recommended: "No suggestions found.",
        artist: `No tracks found for ${decodeHTMLEntities(firstArtist)}.`,
    };


    if (loading) {
        return <>{loadingTexts[contentType ?? "default"]}</>;
    }

    if (actualLength === 0) {
        if (contentType === null) return null;
        return <>{emptyTexts[contentType]}</>;
    }

    if (contentType === null) return null;
    return <>{headingTexts[contentType]}</>;
}