import { useMemo } from "react";
import { decodeHTMLEntities } from "@/lib/helpers";
import { usePlayerStore } from "@/store/usePlayerStore";

interface SectionHeadingProps {
    artistName?: string;
}

export default function SectionHeading({ artistName }: SectionHeadingProps) {
    const isLoading = usePlayerStore((state) => state.loading);
    const contentType = usePlayerStore((state) => state.contentType);
    const recommendedSongsLength = usePlayerStore((state) => state.recommendedSongs.length);
    const albumSongsLength = usePlayerStore((state) => state.albumSongs.length);

    const headingText = useMemo(() => {
        if (!contentType) return null;

        const firstArtist = contentType === "artist" && artistName
            ? decodeHTMLEntities(artistName.split(",")[0].trim())
            : "";

        const totalSongCount = contentType === "album"
            ? albumSongsLength
            : recommendedSongsLength;

        if (isLoading) {
            switch (contentType) {
                case "album": return "Loading album tracks...";
                case "recommended": return "Finding suggestions for you...";
                case "artist": return `Loading ${firstArtist}'s tracks...`;
                default: return "Loading...";
            }
        }

        if (totalSongCount === 0) {
            switch (contentType) {
                case "album": return "No album tracks available.";
                case "recommended": return "No suggestions found.";
                case "artist": return `No tracks found for ${firstArtist}.`;
                default: return null;
            }
        }

        switch (contentType) {
            case "album": return "Album Songs";
            case "recommended": return "You Might Also Like";
            case "artist": return `${firstArtist}'s Tracks`;
            default: return null;
        }
    }, [contentType, isLoading, albumSongsLength, recommendedSongsLength, artistName]);

    if (!headingText) return null;

    return <>{headingText}</>;
}