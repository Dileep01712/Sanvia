import { create } from 'zustand';
import { Song, Album, Artist } from '@/lib/songTypes';

export type PlaybackSource = "dragged" | "album" | "artist" | "recommended" | "homeFeed";
export type ContentType = "album" | "recommended" | "artist" | null;
export type ModalItem = Song | Album | Artist;

const SOURCE_ORDER: PlaybackSource[] = ["dragged", "album", "artist", "recommended", "homeFeed"];
const DYNAMIC_SOURCES: PlaybackSource[] = ['album', 'artist', 'recommended'];

const findValidIndex = (
    songs: Song[],
    startIndex: number,
    direction: 1 | -1,
    skipIds?: Set<string>
): number => {
    const len = songs.length;
    let idx = startIndex + direction;

    while (idx >= 0 && idx < len) {
        const song = songs[idx];
        if (song?.downloadUrl && (!skipIds || !skipIds.has(song.id))) {
            return idx;
        }
        idx += direction;
    }

    return idx;
};
interface PlayerStore {
    isModalOpen: boolean;
    isExpanded: boolean;
    selectedItem: ModalItem | null;
    artistHelper: boolean;
    loading: boolean;
    contentType: ContentType;
    contextId: string | null;

    activeSource: PlaybackSource;
    indices: Record<PlaybackSource, number>;
    isShuffle: boolean;
    shuffleDeck: number[];
    currentSong: Song | null;
    history: { song: Song; source: PlaybackSource; index: number }[];

    draggedSongs: Song[];
    recommendedSongs: Song[];
    artistSongs: Song[];
    albumSongs: Song[];
    homeFeed: Song[];

    newReleases: Song[];
    nowTrendingSongs: Song[];
    albums: Album[];
    topArtists: Artist[];

    setIsModalOpen: (isOpen: boolean) => void;
    setIsExpanded: (isExpanded: boolean) => void;
    openModal: (item: ModalItem, songs: Song[]) => void;
    closeModal: () => void;
    setArtistHelper: (helper: boolean) => void;
    setLoading: (loading: boolean) => void;
    setContentType: (type: ContentType) => void;
    setContextId: (id: string | null) => void;
    setPageData: (data: { newReleases: Song[]; nowTrendingSongs: Song[]; albums: Album[]; topArtists: Artist[]; }) => void;

    setHomeFeed: (feed: Song[]) => void;
    setAlbumSongs: (songs: Song[]) => void;
    setRecommendedSongs: (songs: Song[]) => void;
    setDraggedSongs: (songs: Song[] | ((prev: Song[]) => Song[])) => void;

    play: (source: PlaybackSource, index: number) => void;
    next: () => void;
    previous: () => void;
    toggleShuffle: () => void;
    resetPlayback: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
    isModalOpen: false,
    isExpanded: false,
    selectedItem: null,
    artistHelper: true,
    loading: false,
    contentType: null,
    contextId: null,

    activeSource: "homeFeed",
    indices: { dragged: -1, album: -1, artist: -1, recommended: -1, homeFeed: 0 },
    isShuffle: false,
    shuffleDeck: [],
    currentSong: null,
    history: [],

    draggedSongs: [],
    recommendedSongs: [],
    artistSongs: [],
    albumSongs: [],
    homeFeed: [],

    newReleases: [],
    nowTrendingSongs: [],
    albums: [],
    topArtists: [],

    setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
    setIsExpanded: (isExpanded) => set({ isExpanded: isExpanded }),
    setArtistHelper: (helper) => set({ artistHelper: helper }),
    setLoading: (loading) => set({ loading }),
    setContentType: (type) => set({ contentType: type }),
    setContextId: (id) => set({ contextId: id }),
    setPageData: (data) => set({ ...data }),

    openModal: (item, songs) => {
        const isArtistItem = !!item && "follower_count" in item;

        if (isArtistItem) {
            set({
                selectedItem: item,
                homeFeed: songs,
                isExpanded: true,
                isModalOpen: true,
                currentSong: null,
                activeSource: "homeFeed",
                indices: { dragged: -1, album: -1, artist: -1, recommended: -1, homeFeed: 0 },
                albumSongs: [],
                recommendedSongs: [],
            });
        } else {
            let feed = [...songs];
            let targetIdx = item ? feed.findIndex((s) => s.id === item.id) : -1;

            if (targetIdx === -1 && item) {
                feed = [item as Song, ...feed];
                targetIdx = 0;
            }

            set({
                selectedItem: item,
                homeFeed: feed,
                isExpanded: true,
                isModalOpen: true,
            });

            if (targetIdx !== -1) {
                get().play("homeFeed", targetIdx);
            }
        }
    },

    closeModal: () => set({
        isModalOpen: false,
        selectedItem: null,
        homeFeed: [],
    }),

    setHomeFeed: (feed) => set({ homeFeed: feed }),
    setAlbumSongs: (songs) => set((state) => ({
        albumSongs: songs,
        indices: { ...state.indices, album: -1 }
    })),
    setRecommendedSongs: (songs) => set((state) => ({
        recommendedSongs: songs,
        indices: { ...state.indices, recommended: -1, artist: -1 }
    })),
    setDraggedSongs: (updater) => set((state) => ({
        draggedSongs: typeof updater === 'function' ? updater(state.draggedSongs) : updater
    })),

    play: (source, index) => set((state) => {
        const sourceMap = {
            dragged: state.draggedSongs,
            album: state.albumSongs,
            artist: state.artistSongs,
            recommended: state.recommendedSongs,
            homeFeed: state.homeFeed
        };
        const songs = sourceMap[source] || [];
        let safeIndex = Math.min(index, Math.max(0, songs.length - 1));

        if (!songs[safeIndex]?.downloadUrl) {
            const validIdx = findValidIndex(songs, index - 1, 1);
            safeIndex = validIdx >= 0 && validIdx < songs.length ? validIdx : 0;
        }

        let newDeck = state.shuffleDeck;
        if (state.isShuffle) {
            const validIndices = songs.map((_, idx) => idx).filter(idx => idx !== safeIndex && songs[idx]?.downloadUrl);
            for (let i = validIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validIndices[i], validIndices[j]] = [validIndices[j], validIndices[i]];
            }
            newDeck = validIndices;
        }

        const songToPlay = songs[safeIndex] || null;
        const historyItem = state.currentSong ? { song: state.currentSong, source: state.activeSource, index: state.indices[state.activeSource] } : null;
        const isArtistContext = state.selectedItem && "follower_count" in state.selectedItem;

        return {
            activeSource: source,
            indices: { ...state.indices, [source]: safeIndex },
            currentSong: songToPlay,
            shuffleDeck: newDeck,
            selectedItem: isArtistContext ? state.selectedItem : songToPlay,
            history: historyItem ? [...state.history, historyItem].slice(-50) : state.history,
        };
    }),

    next: () => {
        const state = get();
        let consumedId: string | null = null;

        if (state.activeSource === 'dragged') {
            consumedId = state.currentSong?.id || null;
        }

        set((prev) => {
            const sourceMap = {
                dragged: prev.draggedSongs,
                album: prev.albumSongs,
                artist: prev.artistSongs,
                recommended: prev.recommendedSongs,
                homeFeed: prev.homeFeed,
            };

            const historyItem = prev.currentSong ? { song: prev.currentSong, source: prev.activeSource, index: prev.indices[prev.activeSource] } : null;
            const newHistory = historyItem ? [...prev.history, historyItem].slice(-50) : prev.history;

            const skippedIds = new Set(
                newHistory
                    .filter((h) => h.source === 'dragged')
                    .map((h) => h.song.id)
            );

            const isArtistContext = state.selectedItem && "follower_count" in state.selectedItem;

            const commitNext = (source: PlaybackSource, idx: number, song: Song, newDeck?: number[]) => ({
                activeSource: source,
                indices: { ...prev.indices, [source]: idx },
                currentSong: song,
                selectedItem: isArtistContext ? state.selectedItem : song,
                history: newHistory,
                ...(newDeck !== undefined ? { shuffleDeck: newDeck } : {})
            });

            if (prev.draggedSongs.length > 0) {
                if (prev.activeSource === 'dragged') {
                    const nextIdx = findValidIndex(prev.draggedSongs, prev.indices['dragged'], 1);
                    if (nextIdx >= 0 && nextIdx < prev.draggedSongs.length) {
                        return commitNext('dragged', 0, prev.draggedSongs[nextIdx]);
                    }
                } else {
                    const validIdx = findValidIndex(prev.draggedSongs, -1, 1);
                    if (validIdx >= 0 && validIdx < prev.draggedSongs.length) {
                        return commitNext('dragged', validIdx, prev.draggedSongs[validIdx]);
                    }
                }
            }

            if (prev.isShuffle) {
                if (prev.shuffleDeck.length > 0) {
                    let nextIdx = prev.shuffleDeck[0];
                    let remainingDeck = prev.shuffleDeck.slice(1);
                    const currentArray = sourceMap[prev.activeSource] || [];

                    while (remainingDeck.length > 0) {
                        const candidateIdx = remainingDeck[0];
                        remainingDeck = remainingDeck.slice(1);
                        const candidateSong = currentArray[candidateIdx];

                        if (candidateSong && !skippedIds.has(candidateSong.id)) {
                            nextIdx = candidateIdx;
                            break;
                        }
                    }

                    if (nextIdx !== -1) {
                        return commitNext(prev.activeSource, nextIdx, currentArray[nextIdx], remainingDeck);
                    }
                }

                if (DYNAMIC_SOURCES.includes(prev.activeSource)) {
                    return prev;
                }
            }

            if (DYNAMIC_SOURCES.includes(prev.activeSource)) {
                const currentArray = sourceMap[prev.activeSource] || [];
                const nextIdx = findValidIndex(currentArray, prev.indices[prev.activeSource], 1, skippedIds);
                if (nextIdx >= 0 && nextIdx < currentArray.length) {
                    return commitNext(prev.activeSource, nextIdx, currentArray[nextIdx]);
                }
            } else if (prev.activeSource === 'homeFeed') {
                for (const source of DYNAMIC_SOURCES) {
                    const dynSongs = sourceMap[source] || [];
                    if (dynSongs.length > 0) {
                        const validIdx = findValidIndex(dynSongs, prev.indices[source], 1, skippedIds);
                        if (validIdx >= 0 && validIdx < dynSongs.length) {
                            return commitNext(source, validIdx, dynSongs[validIdx]);
                        }
                    }
                }

                const currentArray = sourceMap['homeFeed'] || [];
                const nextIdx = findValidIndex(currentArray, prev.indices['homeFeed'], 1, skippedIds);
                if (nextIdx >= 0 && nextIdx < currentArray.length) {
                    return commitNext('homeFeed', nextIdx, currentArray[nextIdx]);
                }
            }

            const startPos = SOURCE_ORDER.indexOf(prev.activeSource);
            for (let i = startPos + 1; i < SOURCE_ORDER.length; i++) {
                const nextSource = SOURCE_ORDER[i];
                const nextArray = sourceMap[nextSource] || [];
                if (nextArray.length > 0) {
                    const fallbackIdx = findValidIndex(nextArray, prev.indices[nextSource], 1, skippedIds);
                    if (fallbackIdx >= 0 && fallbackIdx < nextArray.length) {
                        return commitNext(nextSource, fallbackIdx, nextArray[fallbackIdx]);
                    }
                }
            }
            return prev;
        });

        if (consumedId) {
            get().setDraggedSongs((prevSongs) => prevSongs.filter(s => s.id !== consumedId));
        }
    },

    previous: () => {
        const state = get();
        if (state.history.length === 0) return;

        set((prev) => {
            const newHistory = [...prev.history];
            const lastPlayed = newHistory.pop()!;

            const isArtistContext = state.selectedItem && "follower_count" in state.selectedItem;

            return {
                activeSource: lastPlayed.source,
                indices: { ...prev.indices, [lastPlayed.source]: lastPlayed.index },
                currentSong: lastPlayed.song,
                selectedItem: isArtistContext ? state.selectedItem : lastPlayed.song,
                history: newHistory,
            };
        });
    },

    toggleShuffle: () => set((state) => {
        const newIsShuffle = !state.isShuffle;
        if (newIsShuffle) {
            const sourceMap = {
                dragged: state.draggedSongs,
                album: state.albumSongs,
                artist: state.artistSongs,
                recommended: state.recommendedSongs,
                homeFeed: state.homeFeed
            };
            const currentArray = sourceMap[state.activeSource] || [];
            const currentIndex = state.indices[state.activeSource];

            const validIndices = currentArray.map((_, idx) => idx).filter((idx) => idx !== currentIndex && currentArray[idx]?.downloadUrl);

            for (let i = validIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validIndices[i], validIndices[j]] = [validIndices[j], validIndices[i]];
            }
            return { isShuffle: true, shuffleDeck: validIndices };
        }
        return { isShuffle: false, shuffleDeck: [] };
    }),

    resetPlayback: () => set({
        activeSource: "homeFeed",
        indices: { dragged: -1, album: -1, artist: -1, recommended: -1, homeFeed: 0 },
        isShuffle: false,
        currentSong: null,
        history: [],
        albumSongs: [],
        recommendedSongs: [],
        contextId: null,
    })
}));