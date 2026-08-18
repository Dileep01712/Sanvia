import { useState, useCallback, useRef } from "react";
import { downloadSong } from "@/lib/songTypes";

export function useDownload() {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const isDownloadingRef = useRef(false);

    const triggerDownload = useCallback(
        async (streamingUrl: string, songTitle?: string, primaryArtists?: string) => {

            if (!streamingUrl || !songTitle || !primaryArtists) {
                console.warn("[useDownload] Missing streamingUrl or songTitle or primaryArtists");
                return;
            }

            if (isDownloadingRef.current) {
                console.warn("[useDownload] Already downloading, ignoring duplicate click");
                return;
            }

            isDownloadingRef.current = true;
            setIsDownloading(true);
            setDownloadProgress(0);

            try {
                await downloadSong(streamingUrl, songTitle, primaryArtists, (percent) => {
                    setDownloadProgress(percent);
                });
            } catch (error) {
                console.error("[useDownload] Download failed:", error);
                setDownloadProgress(0);
            } finally {
                isDownloadingRef.current = false;
                setIsDownloading(false);
            }
        }, []
    );

    return {
        isDownloading,
        downloadProgress,
        triggerDownload,
    };
}