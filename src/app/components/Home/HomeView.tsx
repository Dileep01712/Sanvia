"use client";

import React, { useCallback, useRef } from "react";
import { Song, Album, Artist } from "@/lib/songTypes";
import MainSection from "./MainSection";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { useHomepageSearch } from "./hooks/useHomeSearch";
import Search from "../Search/SearchResults";
import NowPlayingModal from "../Player/PlayerView";
import { usePlayerStore } from "@/store/usePlayerStore";

interface Props {
    newReleases: Song[];
    nowTrendingSongs: Song[];
    albums: Album[];
    topArtists: Artist[];
}

type ModalItem = Song | Album | Artist;

export default function Home({
    newReleases,
    nowTrendingSongs,
    albums,
    topArtists,
}: Props) {
    const {
        inputQuery,
        setInputQuery,
        searchQuery,
        searchItems,
        isValidQuery,
        isScrolled,
        closeSearch,
    } = useHomepageSearch();

    const openModal = usePlayerStore((state) => state.openModal);
    const setPageData = usePlayerStore((state) => state.setPageData);

    const hasHydrated = useRef(false);
    if (!hasHydrated.current) {
        setPageData({ newReleases, nowTrendingSongs, albums, topArtists });
        hasHydrated.current = true;
    }

    const handleSearchSubmit = useCallback(() => {
        if (inputQuery.trim() && isValidQuery) {
            setInputQuery(inputQuery.trim());
        }
    }, [inputQuery, isValidQuery, setInputQuery]);

    const handleClearSearch = useCallback(() => {
        closeSearch();
    }, [closeSearch]);

    const handleSongSelect = useCallback((item: ModalItem, songs: Song[]) => {
        openModal(item, songs);
    }, [openModal]);

    const showBackButton = searchItems;

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <Header
                inputValue={inputQuery}
                onInputChange={setInputQuery}
                isValidQuery={isValidQuery}
                onSearchSubmit={handleSearchSubmit}
                showBackButton={showBackButton}
                onBackClick={handleClearSearch}
                isScrolled={isScrolled}
            />

            {searchItems ? (
                <Search
                    query={searchQuery}
                    onSongSelect={handleSongSelect}
                />
            ) : (
                <MainSection />
            )}

            <NowPlayingModal />

            <Footer />
        </div>
    );
}