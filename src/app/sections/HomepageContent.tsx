"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPlay, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Song, Album, Artist } from "@/lib/songs";
import NowPlayingModal from "./NowPlayingModal";
import SongSearch from "@/lib/SearchSongs";

interface Props {
    newReleases: Song[];
    nowTrendingSongs: Song[];
    albums: Album[];
    topArtists: Artist[];
}

type ModalItem = Song | Album | Artist;

export default function HomepageContent({
    newReleases,
    nowTrendingSongs,
    albums,
    topArtists,
}: Props) {
    const [playlist, setPlaylist] = useState<Song[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [selectedItem, setSelectedItem] = useState<ModalItem | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchItems, setSearchItems] = useState(false);
    const [inputQuery, setInputQuery] = useState("");
    const [artistHelper, setArtistHelper] = useState(true);

    // Open Modal
    const openModal = (item: ModalItem, songs: Song[]) => {
        setSelectedItem(item);
        setPlaylist(songs);
        setIsModalOpen(true);
    };

    // Page scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-zinc-950">
            {/* Header */}
            <header className={`flex justify-between py-3 md:px-8 px-2 sticky top-0 z-50 text-white backdrop-blur md:transition-all md:duration-300 ${isScrolled ? "bg-zinc-950/40 shadow-xl shadow-gray-700/40 border-b border-transparent" : "bg-zinc-950 border-b border-zinc-800"}`}>

                {searchItems && searchQuery ?
                    <Button variant={"secondary"} onClick={() => { setInputQuery(""); setSearchItems(false); }} className={`flex items-center gap-2 select-none group h-10 mr-1.5 font-Lato ${isModalOpen && isExpanded ? "opacity-70 pointer-events-none" : ""}`}>
                        <FontAwesomeIcon icon={faArrowLeft} className="transition-transform transform group-hover:-translate-x-1" />
                        Back
                    </Button>
                    :
                    <Image src="/images/logo.png" alt="Sanvia Logo" height={40} width={90} className={`select-none md:!w-[90px] md:!h-[40px] !max-w-none rounded-md pr-1 my-auto ${isModalOpen && isExpanded ? "opacity-70 pointer-events-none" : ""}`} />
                }

                <div className={`flex items-center bg-zinc-800 rounded-lg md:focus-within:border-2 focus-within:border-transparent border md:border-2 border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-200 md:transition-all md:duration-300 w-72 md:focus-within:w-1/2 ${isModalOpen && isExpanded ? "opacity-70 pointer-events-none" : ""}`}>
                    <Input placeholder="Search" className="h-10 border-none rounded-l-lg focus-visible:ring-transparent select-none font-Lato" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && inputQuery.trim()) { setSearchQuery(inputQuery.trim()); setSearchItems(true); setArtistHelper(true); } }} />
                    <Button className="h-10 rounded-none rounded-r-lg" onClick={() => { if (inputQuery.trim()) { setSearchQuery(inputQuery.trim()); setSearchItems(true); setArtistHelper(true); } }}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </Button>
                </div>

            </header>

            {searchItems ? (
                // Search Section
                <SongSearch query={searchQuery} onSongSelect={openModal} />
            ) : (
                // Main Section
                <main className="flex-1 bg-zinc-900/70 text-white md:p-6 p-2">
                    <SongSection title="New Releases">
                        {newReleases.length === 0
                            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                            : newReleases.map((song) => (
                                <SongCard key={song.id} song={song} onClick={() => openModal(song, newReleases)} />
                            ))}
                    </SongSection>

                    <SongSection title="Trending Songs" tooltip="This list will auto-update once the “Now Trending” playlist is updated on JioSaavn.">
                        {nowTrendingSongs.length === 0
                            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                            : nowTrendingSongs.map((song) => (
                                <SongCard key={song.id} song={song} onClick={() => openModal(song, nowTrendingSongs)} />
                            ))}
                    </SongSection>

                    <SongSection title="Albums">
                        {albums.length === 0
                            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                            : albums.map((album) => (
                                <SongCard key={album.id} song={album} onClick={() => openModal(album, albums)} />
                            ))}
                    </SongSection>

                    <SongSection title="Top Artists">
                        {topArtists.length === 0
                            ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                            : topArtists.map((artist) => (
                                <ArtistCard key={artist.id} artist={artist} onClick={() => openModal(artist, [])} />
                            ))}
                    </SongSection>
                </main>
            )}

            <NowPlayingModal isOpen={isModalOpen} setIsModalOpen={setIsModalOpen} isExpanded={isExpanded} setIsExpanded={setIsExpanded} item={selectedItem} playlist={playlist} topArtists={topArtists} onArtistChange={(artist) => setSelectedItem(artist)} setPlaylist={setPlaylist} artistHelper={artistHelper} />

            {/* Footer */}
            <footer className={`bg-zinc-950 border-t border-zinc-800 text-gray-300 font-Lato text-sm md:px-9 px-3 py-3 select-none ${isExpanded ? "md:h-44 h-64" : "md:h-56 h-96"}`}>

                <div className="border-b border-zinc-800 pb-3 text-center">
                    © 2025 Sanvia. All rights reserved.
                </div>

                <div className="grid md:grid-cols-2 grid-rows-2 py-5">
                    <div className="flex justify-start">
                        <p>
                            <b>Sanvia&nbsp;</b> - &quot;A musical path inspired by someone special.&quot;
                            It&apos;s a hidden tribute to <b><sub>*******</sub></b> <br /> Softening the name to <b>San</b>, and adding <b>via</b> to express the journey of love, sound, and emotion.
                        </p>
                    </div>

                    <div className="flex flex-col justify-end md:text-right">
                        <p>
                            Note: Music data is powered by the unofficial JioSaavn API.
                        </p>
                        <p>
                            Developed by <b>Dileep Yadav</b>
                        </p>
                    </div>
                </div>
            </footer>
        </div >
    );
}

// Song section wrapper
function SongSection({
    title,
    tooltip,
    children,
}: {
    title: string;
    tooltip?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="md:pb-16 pb-12 last:pb-7">
            <h2 className="flex items-center text-xl font-Black-Marker text-white pb-2 pl-1.5 select-none">
                {title}
                {tooltip && (
                    <div className="relative group ml-2 hidden md:block">
                        <svg className="relative h-5 cursor-pointer -top-0.5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
                        <div className="absolute hidden group-hover:flex items-center left-full ml-1.5 top-1/2 -translate-y-1/2 z-10">
                            <div className="w-2 h-2 rotate-45 bg-zinc-600 -mr-1"></div>
                            <div className="bg-zinc-600 text-white text-xs font-Lato rounded-md px-3 py-1 whitespace-nowrap">
                                {tooltip}
                            </div>
                        </div>
                    </div>
                )}
            </h2>
            <div className="grid md:gap-8 gap-4 p-2 md:grid-cols-6 grid-cols-2 md:grid-rows-2">{children}</div>
        </section>
    );
}

// Individual Song Card
function SongCard({ song, onClick }: { song: Song; onClick?: () => void }) {
    return (
        <div onClick={onClick} className="md:w-[212px] md:rounded-xl rounded-lg transition-all duration-300 ease-in-out md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-gray-400/40 cursor-pointer group" >
            <div className="relative">
                <Image src={song.image} alt={song.name} width={212} height={180} className="object-cover rounded-lg pb-0.5 group-hover:brightness-75 transition-all duration-300 ease-in-out select-none md:min-h-[212px] min-h-[156px]" />
                <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 rounded-full opacity-0 group-hover:opacity-100 w-12 h-12 flex items-center justify-center transition-all duration-300 ease-in-out">
                    <FontAwesomeIcon icon={faPlay} className="text-white h-6 w-6 relative left-0.5" />
                </button>
            </div>
            <h3 className="text-sm font-Lato truncate px-2.5 text-center transition-all duration-300 ease-in-out">{song.name}</h3>
            <p className="text-sm font-Lato text-gray-400 truncate p-2.5 pt-0 text-center transition-all duration-300 ease-in-out">{song.primaryArtists}</p>
        </div >
    );
}

// Individual Artist Card
function ArtistCard({ artist, onClick }: { artist: Artist; onClick?: () => void }) {
    return (
        <div onClick={onClick} className="md:w-[212px] md:rounded-xl rounded-lg transition-all duration-300 ease-in-out md:hover:scale-105 md:hover:shadow-lg md:hover:shadow-gray-400/40 cursor-pointer group">
            <Image src={artist.image} alt={artist.name} width={212} height={180} className="object-cover rounded-lg pb-0.5 transition-all duration-300 ease-in-out select-none md:min-h-[212px] min-h-[156px]" />
            <h3 className="text-sm font-Lato truncate px-2.5 text-center transition-all duration-300 ease-in-out">{artist.name}</h3>
            <p className="text-sm font-Lato text-gray-400 truncate p-2.5 pt-0 text-center transition-all duration-300 ease-in-out">
                {Number(artist.follower_count).toLocaleString("en-IN")} Fans
            </p>
        </div>
    );
}

// Skeleton
function SkeletonCard() {
    return (
        <div className="md:w-[212px] md:rounded-xl rounded-lg bg-zinc-800 cursor-pointer transition-all duration-300 ease-in-out md:hover:scale-105 md:hover:shadow-lg md:
        md:hover:shadow-gray-400/40 pb-1">
            <div className="md:h-52 h-40 bg-zinc-700 animate-pulse rounded-md"></div>
            <div className="h-6 bg-zinc-700 rounded w-3/4 mx-auto animate-pulse my-1"></div>
            <div className="h-6 bg-zinc-700 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
    );
}
