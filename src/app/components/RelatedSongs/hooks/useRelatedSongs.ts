import { useCallback, useEffect, useMemo, useRef } from "react";
import { Song } from "@/lib/songTypes";
import { generateRecommendations } from "../utils/recommendations";
import { getBestQualityDownload, normalizeTitle } from "@/lib/helpers";
import { usePlayerStore } from "@/store/usePlayerStore";

type EnvConfig = {
    SONG_SEARCH_PRIMARY_API: string;
    SONG_SEARCH_FALLBACK_API: string;
    SONG_BY_ID_API: string;
    ALBUM_BY_LINK_API: string;
};

export const useRelatedSongs = (
    currentSong: Song | null,
    artistName: string | undefined,
): { reset: () => void } => {
    const activeSource = usePlayerStore((state) => state.activeSource);
    const setContentType = usePlayerStore((state) => state.setContentType);
    const setLoading = usePlayerStore((state) => state.setLoading);
    const setAlbumSongs = usePlayerStore((state) => state.setAlbumSongs);
    const setRecommendedSongs = usePlayerStore((state) => state.setRecommendedSongs);
    const setContextId = usePlayerStore((state) => state.setContextId);

    const env = useMemo<EnvConfig | null>(() => {
        const SONG_SEARCH_PRIMARY_API = process.env.NEXT_PUBLIC_SONG_SEARCH_PRIMARY_API_URL;
        const SONG_SEARCH_FALLBACK_API = process.env.NEXT_PUBLIC_SONG_SEARCH_FALLBACK_API_URL;
        const SONG_BY_ID_API = process.env.NEXT_PUBLIC_SONG_BY_ID_API_URL;
        const ALBUM_BY_LINK_API = process.env.NEXT_PUBLIC_ALBUM_BY_LINK_API_URL;

        if (
            !SONG_SEARCH_PRIMARY_API ||
            !SONG_SEARCH_FALLBACK_API ||
            !SONG_BY_ID_API ||
            !ALBUM_BY_LINK_API
        ) {
            return null;
        }

        return { SONG_BY_ID_API, SONG_SEARCH_PRIMARY_API, SONG_SEARCH_FALLBACK_API, ALBUM_BY_LINK_API };
    }, []);

    const fetchIdRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastFetched = useRef({ album: '', recs: '', artist: '' });

    const reset = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        lastFetched.current = { album: '', recs: '', artist: '' };

        setLoading(true);
        setAlbumSongs([]);
        setRecommendedSongs([]);
        setContextId(null);
    }, [setLoading, setAlbumSongs, setRecommendedSongs, setContextId]);

    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const currentFetchId = ++fetchIdRef.current;
        const isStale = () => currentFetchId !== fetchIdRef.current || controller.signal.aborted;

        if (!env || (!currentSong && !artistName)) {
            setLoading(false);
            setAlbumSongs([]);
            setRecommendedSongs([]);
            setContextId(null);
            return;
        }

        const fetchData = async () => {
            if (isStale()) return;

            const state = usePlayerStore.getState();
            const activeSource = state.activeSource;

            if (activeSource === 'queued') {
                if (!isStale()) setLoading(false);
                return;
            }

            const indices = state.indices;
            const isShuffle = state.isShuffle;
            const shuffleDeck = state.shuffleDeck;

            const sourceMap = {
                album: state.albumSongs,
                artist: state.artistSongs,
                recommended: state.recommendedSongs,
                homeFeed: state.homeFeed,
                queued: state.queuedSongs,
            };

            const currentArray = sourceMap[activeSource] || [];
            const currentIdx = indices[activeSource];

            const isLastInSource = currentArray.length > 0 && (
                (!isShuffle && currentIdx >= currentArray.length - 1) ||
                (isShuffle && shuffleDeck.length === 0)
            );

            const parsedDownloadUrl = getBestQualityDownload(currentSong?.downloadUrl);

            let albumUrl = '';
            const albumData = currentSong?.album as { url?: string };

            if (albumData?.url?.includes('/album/')) {
                albumUrl = albumData.url;
            } else if (typeof currentSong?.downloadUrl === 'string' && currentSong.downloadUrl.includes('/album/')) {
                albumUrl = currentSong.downloadUrl;
            } else if (typeof parsedDownloadUrl === 'string' && parsedDownloadUrl.includes('/album/')) {
                albumUrl = parsedDownloadUrl;
            } else if (typeof currentSong?.url === 'string' && currentSong.url.includes('/album/')) {
                albumUrl = currentSong.url;
            }

            const isExplicitAlbum = currentSong?.type === 'album';
            const isExplicitSong = currentSong?.type === 'song';
            const isAlbumContext = !!albumUrl;
            const isSongContext = !!currentSong?.id;
            const isForeground = activeSource === 'homeFeed';
            const isBackgroundFetch = isLastInSource && (activeSource === 'album' || activeSource === 'recommended' || activeSource === 'artist');

            let intent: 'album' | 'recommended' | 'artist' | null = null;

            if (isBackgroundFetch) {
                intent = 'recommended';
            }
            else if (activeSource === 'recommended') {
                intent = null;
            }
            else if (
                isExplicitAlbum ||
                (isAlbumContext && (!isExplicitSong || (activeSource === 'album' && albumUrl === lastFetched.current.album)))
            ) {
                intent = 'album';
            }
            else if (isExplicitSong || isSongContext) {
                intent = 'recommended';
            }
            else if (!currentSong && artistName?.trim()) {
                intent = 'artist';
            }

            if (!intent) {
                if (!isStale()) {
                    if (activeSource === 'album') setContentType('album');
                    else if (activeSource === 'recommended') setContentType('recommended');
                    else if (activeSource === 'artist') setContentType('artist');
                    setLoading(false);
                }
                return;
            }

            try {
                const prepareFetch = () => {
                    if (!isBackgroundFetch) {
                        setContentType(intent as 'album' | 'recommended' | 'artist');
                        setAlbumSongs([]);
                        setRecommendedSongs([]);
                    } else {
                        if (intent === 'recommended' && currentSong) {
                            setContentType('recommended');
                            setAlbumSongs([]);
                            setRecommendedSongs([currentSong]);
                        }
                    }
                    setLoading(true);
                    if (isForeground) setContextId(null);
                };

                if (intent === 'album') {
                    if (lastFetched.current.album === albumUrl) {
                        if (!isStale()) {
                            setContentType('album');
                            setLoading(false);
                        }
                        return;
                    }

                    prepareFetch();
                    lastFetched.current.album = albumUrl;

                    const res = await fetch(`${env.ALBUM_BY_LINK_API}${encodeURIComponent(albumUrl)}`, { signal: controller.signal });
                    if (isStale()) return;
                    const data = await res.json();
                    if (isStale()) return;

                    let extractedSongs: Song[] = [];
                    if (data.success && data.data) {
                        if (Array.isArray(data.data.songs)) extractedSongs = data.data.songs;
                        else if (Array.isArray(data.data.results)) extractedSongs = data.data.results;
                        else if (Array.isArray(data.data)) extractedSongs = data.data;
                    }

                    if (!isStale()) {
                        setAlbumSongs(extractedSongs);
                        setContextId(currentSong?.id || null);
                        setLoading(false);
                    }
                    return;
                }

                if (intent === 'recommended') {
                    if (lastFetched.current.recs === currentSong!.id) {
                        if (!isStale()) {
                            setContentType('recommended');
                            setLoading(false);
                        }
                        return;
                    }

                    prepareFetch();
                    lastFetched.current.recs = currentSong!.id;

                    const res = await fetch(`${env.SONG_BY_ID_API}${currentSong?.id}`, { signal: controller.signal });
                    if (isStale()) return;
                    const data = await res.json();
                    if (isStale()) return;

                    let recommended: Song[] = [];
                    if (data.success && Array.isArray(data.data) && data.data.length) {
                        const sessionHistory = usePlayerStore.getState().history.map(h => h.song);
                        const fullContextArray = [...sessionHistory, data.data[0]];

                        recommended = await generateRecommendations(fullContextArray, env.SONG_SEARCH_PRIMARY_API, env.SONG_SEARCH_FALLBACK_API, controller.signal);
                    }

                    if (!isStale()) {
                        if (isBackgroundFetch && currentSong) {
                            const newBatch = recommended.filter(s => s.id !== currentSong.id).slice(0, 14);

                            let newDeck: number[] = [];
                            if (usePlayerStore.getState().isShuffle) {
                                newDeck = Array.from({ length: newBatch.length }, (_, i) => i + 1);
                                for (let i = newDeck.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
                                }
                            }

                            setRecommendedSongs([currentSong, ...newBatch]);

                            usePlayerStore.setState((state) => ({
                                activeSource: 'recommended',
                                indices: { ...state.indices, recommended: 0 },
                                shuffleDeck: newDeck
                            }));
                        } else {
                            setContentType('recommended');
                            setRecommendedSongs(recommended);
                            setAlbumSongs([]);
                        }
                        setLoading(false);
                    }
                    return;
                }

                if (intent === 'artist') {
                    const artistStr = artistName!.trim();
                    if (lastFetched.current.artist === artistStr) {
                        if (!isStale()) {
                            setContentType('artist');
                            setLoading(false);
                        }
                        return;
                    }

                    prepareFetch();
                    lastFetched.current.artist = artistStr;

                    const artists = artistStr.split(",").map(a => a.trim());
                    const TARGET = 15;
                    const songGroups = new Map<string, Song>();

                    const fetchPage = async (artist: string, page: number) => {
                        let res = await fetch(`${env.SONG_SEARCH_PRIMARY_API}${encodeURIComponent(artist)}&limit=50&page=${page}`, { signal: controller.signal });
                        if (isStale()) return null;
                        let data = await res.json();
                        if (isStale()) return null;

                        if (!res.ok || !data.success || !Array.isArray(data.data?.results)) {
                            res = await fetch(`${env.SONG_SEARCH_FALLBACK_API}${encodeURIComponent(artist)}&limit=50&page=${page}`, { signal: controller.signal });
                            if (isStale()) return null;
                            data = await res.json();
                            if (isStale()) return null;
                        }
                        return data;
                    };

                    for (const artist of artists) {
                        const MAX_PAGES = 3;
                        for (let page = 1; page <= MAX_PAGES; page++) {
                            const data = await fetchPage(artist, page);
                            if (data === null) return;

                            if (data.success && Array.isArray(data.data?.results) && data.data.results.length) {
                                data.data.results.forEach((song: Song) => {
                                    const normalizedTitle = normalizeTitle(song.name || "");
                                    if (!songGroups.has(normalizedTitle)) songGroups.set(normalizedTitle, song);
                                });
                            } else {
                                break;
                            }

                            if (songGroups.size >= TARGET) break;
                        }
                        if (songGroups.size >= TARGET) break;
                    }

                    const songs = Array.from(songGroups.values())
                        .sort(() => 0.5 - Math.random())
                        .slice(0, TARGET);

                    if (!isStale()) {
                        setRecommendedSongs(songs);
                        setAlbumSongs([]);
                        setLoading(false);
                    }
                    return;
                }
            } catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError") && !isStale()) {
                    setLoading(false);
                }
            } finally {
                if (!isStale()) setLoading(false);
            }
        };

        fetchData();
        return () => {
            controller.abort();
            if (abortControllerRef.current === controller) abortControllerRef.current = null;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        currentSong?.downloadUrl,
        currentSong?.id,
        artistName,
        env,
        activeSource,
        reset,
        setContentType,
        setLoading,
        setAlbumSongs,
        setRecommendedSongs,
        setContextId
    ]);

    return { reset };
};