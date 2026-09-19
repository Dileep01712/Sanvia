import { useState, useEffect, useMemo } from "react";
import Section from "./sections/Section";
import SkeletonCard from "./ui/SkeletonCard";
import SongCard from "./ui/SongCard";
import ArtistCard from "./ui/ArtistCard";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Song, Artist } from "@/lib/songTypes";
import { fetchMadeForYou } from "@/lib/songTypes";

const PLAYS_PER_REGENERATION = 6;

export default function HomeFeed() {
    const [isHydrated, setIsHydrated] = useState(false);
    const [sessionPlays, setSessionPlays] = useState(0);

    const newReleases = usePlayerStore((state) => state.newReleases);
    const nowTrendingSongs = usePlayerStore((state) => state.nowTrendingSongs);
    const viralSongs = usePlayerStore((state) => state.viralSongs);
    const albums = usePlayerStore((state) => state.albums);
    const topArtists = usePlayerStore((state) => state.topArtists);
    const openModal = usePlayerStore((state) => state.openModal);
    const madeForYou = usePlayerStore((state) => state.madeForYou);
    const setMadeForYou = usePlayerStore((state) => state.setMadeForYou);
    const history = usePlayerStore((state) => state.history);
    const currentSong = usePlayerStore((state) => state.currentSong);

    useEffect(() => {
        usePlayerStore.persist.rehydrate()?.then(() => setIsHydrated(true));
    }, []);

    useEffect(() => {
        if (currentSong?.id) {
            setSessionPlays((prev) => prev + 1);
        }
    }, [currentSong?.id]);

    useEffect(() => {
        if (!isHydrated) return;

        const shouldGenerate = madeForYou.length === 0 || sessionPlays >= PLAYS_PER_REGENERATION;

        if (shouldGenerate) {
            fetchMadeForYou(history).then((songs) => {
                if (songs.length > 0) {
                    setMadeForYou(songs);
                    setSessionPlays(0);
                }
            });
        }
    }, [isHydrated, history, madeForYou.length, sessionPlays, setMadeForYou]);

    const recentSongs = useMemo(() => {
        const allRecent = currentSong
            ? [...history.map(h => h.song), currentSong]
            : history.map(h => h.song);

        const uniqueRecent: Song[] = [];
        const seen = new Set();

        for (let i = allRecent.length - 1; i >= 0 && uniqueRecent.length < 12; i--) {
            const song = allRecent[i];

            if (song && song.type !== "album" && !seen.has(song.id)) {
                seen.add(song.id);

                let artistString = song.primaryArtists;
                if (!artistString && song.artists?.primary?.length) {
                    artistString = song.artists.primary.map((a: Artist) => a.name).join(", ");
                } else if (!artistString && song.artists?.all?.length) {
                    artistString = song.artists.all.map((a: Artist) => a.name).join(", ");
                }

                uniqueRecent.push({ ...song, primaryArtists: artistString || "Unknown Artist" });
            }
        }

        return uniqueRecent;
    }, [history, currentSong]);

    const sections = useMemo(() => {
        const showHistory = !isHydrated || recentSongs.length > 0;
        const historyData = isHydrated ? recentSongs : [];

        const showDiscoverNext = true;
        const discoverData = isHydrated && madeForYou.length > 0 ? madeForYou : [];

        return [
            ...(showHistory ? [{ title: "Replay", data: historyData, type: "song" as const }] : []),
            ...(showDiscoverNext ? [{ title: "For You", data: discoverData, type: "song" as const }] : []),
            { title: "New Drops", data: newReleases, type: "song" as const },
            { title: "Charts", data: nowTrendingSongs, type: "song" as const },
            { title: "Social Trends", data: viralSongs || [], type: "song" as const },
            { title: "Albums", data: albums, type: "album" as const },
            { title: "Top Artists", data: topArtists, type: "artist" as const },
        ];
    }, [isHydrated, recentSongs, madeForYou, newReleases, nowTrendingSongs, viralSongs, albums, topArtists]);

    return (
        <main className="flex-1 bg-zinc-900/70 text-white md:p-6">
            {sections.map((section) => (
                <Section key={section.title} title={section.title}>
                    {section.data.length === 0
                        ? Array.from({ length: 12 }).map((_, index) => (
                            <SkeletonCard
                                key={index}
                                isArtist={section.type === "artist"}
                            />
                        ))
                        : section.data.map((item) => {
                            const displayType = section.type === "artist"
                                ? "artist"
                                : (item as Song | { type?: string }).type || section.type;

                            const typedItem = { ...item, type: displayType };

                            return section.type === "artist" ? (
                                <ArtistCard
                                    key={item.id}
                                    artist={typedItem as Artist}
                                    onClick={() => openModal(typedItem, [])}
                                />
                            ) : (
                                <SongCard
                                    key={item.id}
                                    song={typedItem as Song}
                                    isAlbum={section.type !== "album" && typedItem.type === "album"}
                                    onClick={() => openModal(typedItem, section.data as Song[])}
                                />
                            );
                        })
                    }
                </Section>
            ))}
        </main>
    );
}