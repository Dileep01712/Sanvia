import { create } from "zustand";

interface DownloadState {
    progress: number;
    isDownloading: boolean;
}

interface DownloadStore {
    downloads: Record<string, DownloadState>;
    startDownload: (id: string) => void;
    setProgress: (id: string, progress: number) => void;
    finishDownload: (id: string) => void;
}

export const useDownloadStore = create<DownloadStore>((set) => ({
    downloads: {},
    startDownload: (id) =>
        set((state) => ({
            downloads: { ...state.downloads, [id]: { progress: 0, isDownloading: true } },
        })),
    setProgress: (id, progress) =>
        set((state) => ({
            downloads: {
                ...state.downloads,
                [id]: { ...state.downloads[id], progress },
            },
        })),
    finishDownload: (id) =>
        set((state) => {
            const newDownloads = { ...state.downloads };
            delete newDownloads[id];
            return { downloads: newDownloads };
        }),
}));