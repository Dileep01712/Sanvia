import { useCallback } from "react";
import { downloadSong } from "@/lib/songTypes";
import { useDownloadStore } from "@/store/useDownloadStore";

const abortControllers = new Map<string, AbortController>();

export function useDownload(songId: string) {
    const { downloads, setProgress, startDownload, finishDownload } = useDownloadStore();

    const downloadState = downloads[songId] || { isDownloading: false, progress: 0 };
    const { isDownloading, progress: downloadProgress } = downloadState;

    const cancelDownload = useCallback(() => {
        const controller = abortControllers.get(songId);
        if (controller) {
            controller.abort();
            abortControllers.delete(songId);
        }
        finishDownload(songId);
    }, [songId, finishDownload]);

    const triggerDownload = useCallback(
        async (streamingUrl: string, songTitle?: string, primaryArtists?: string) => {
            if (!streamingUrl || !songTitle || !primaryArtists) {
                console.warn("[useDownload] Missing required download parameters");
                return;
            }

            if (isDownloading) {
                console.warn("[useDownload] Already downloading, ignoring duplicate click");
                return;
            }

            const controller = new AbortController();
            abortControllers.set(songId, controller);

            startDownload(songId);

            try {
                await downloadSong(
                    streamingUrl,
                    songTitle,
                    primaryArtists,
                    (percent) => {
                        setProgress(songId, percent);
                    },
                    controller.signal
                );
            } catch (error: unknown) {
                if (error instanceof Error && error.name === "AbortError") {
                    console.info("[useDownload] Download cancelled by user");
                } else {
                    console.error("[useDownload] Download failed:", error);
                }
            } finally {
                abortControllers.delete(songId);
                finishDownload(songId);
            }
        },
        [songId, isDownloading, startDownload, setProgress, finishDownload]
    );

    return {
        isDownloading,
        downloadProgress,
        triggerDownload,
        cancelDownload,
    };
}