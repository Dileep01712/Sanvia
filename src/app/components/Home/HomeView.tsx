"use client";

import React, { useCallback, useRef } from "react";
import { Song, Album, Artist } from "@/lib/songTypes";
import HomeFeed from "./HomeFeed";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { useHomeSearch } from "./hooks/useHomeSearch";
import SearchResults from "../Search/SearchResults";
import PlayerView from "../Player/PlayerView";
import { usePlayerStore } from "@/store/usePlayerStore";

interface HomeViewProps {
    newReleases: Song[];
    nowTrendingSongs: Song[];
    albums: Album[];
    topArtists: Artist[];
}

type ModalItem = Song | Album | Artist;

export default function HomeView({
    newReleases,
    nowTrendingSongs,
    albums,
    topArtists,
}: HomeViewProps) {
    const {
        inputQuery,
        setInputQuery,
        searchQuery,
        isSearchActive,
        isValidQuery,
        isScrolled,
        closeSearch,
        handleSearchSubmit,
    } = useHomeSearch();

    const openModal = usePlayerStore((state) => state.openModal);
    const setPageData = usePlayerStore((state) => state.setPageData);

    const hasHydrated = useRef(false);
    if (!hasHydrated.current) {
        setPageData({ newReleases, nowTrendingSongs, albums, topArtists });
        hasHydrated.current = true;
    }

    const handleClearSearch = useCallback(() => {
        closeSearch();
    }, [closeSearch]);

    const handleSongSelect = useCallback((item: ModalItem, songs: Song[]) => {
        openModal(item, songs);
    }, [openModal]);

    const showBackButton = isSearchActive;

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

            {isSearchActive ? (
                <SearchResults
                    query={searchQuery}
                    onSongSelect={handleSongSelect}
                />
            ) : (
                <HomeFeed />
            )}

            <PlayerView />

            <Footer />
        </div>
    );
}