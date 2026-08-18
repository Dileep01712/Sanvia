import Section from "./sections/Section";
import SkeletonCard from "./ui/SkeletonCard";
import SongCard from "./ui/SongCard";
import ArtistCard from "./ui/ArtistCard";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Song, Artist } from "@/lib/songTypes";

export default function MainSection() {
    const newReleases = usePlayerStore((state) => state.newReleases);
    const nowTrendingSongs = usePlayerStore((state) => state.nowTrendingSongs);
    const albums = usePlayerStore((state) => state.albums);
    const topArtists = usePlayerStore((state) => state.topArtists);
    const openModal = usePlayerStore((state) => state.openModal);
    
    const sections = [
        { title: "New Releases", data: newReleases, type: "song" },
        { title: "Trending Now", data: nowTrendingSongs, type: "song" },
        { title: "Albums", data: albums, type: "album" },
        { title: "Top Artists", data: topArtists, type: "artist" },
    ] as const;

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
                        : section.data.map((item) => (
                            section.type === "artist" ? (
                                <ArtistCard
                                    key={item.id}
                                    artist={item as Artist}
                                    onClick={() => openModal(item, [])}
                                />
                            ) : (
                                <SongCard
                                    key={item.id}
                                    song={item as Song}
                                    onClick={() => openModal(item, section.data as Song[])}
                                />
                            )
                        ))
                    }
                </Section>
            ))}
        </main>
    );
}