import { usePlayerStore } from "@/store/usePlayerStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlay,
    faPause,
    faCircleNotch,
    faForwardStep,
    faBackwardStep,
    faRepeat,
    faShuffle,
    faDownload,
    faSpinner,
    faVolumeXmark,
    faVolumeHigh
} from "@fortawesome/free-solid-svg-icons";

interface PlayerControlsProps {
    volume: number;
    isMuted: boolean;
    isPlaying: boolean;
    isRepeat: boolean;
    isLoading: boolean;
    isDownloading?: boolean;
    downloadProgress?: number;
    streamingUrl: string;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onToggleRepeat: () => void;
    onDownloadRequest?: () => void;
}

export default function PlayerControls({
    volume,
    isMuted,
    isPlaying,
    isRepeat,
    isLoading,
    isDownloading,
    downloadProgress,
    streamingUrl,
    onTogglePlay,
    onToggleMute,
    onToggleRepeat,
    onDownloadRequest,
}: PlayerControlsProps) {
    const next = usePlayerStore((state) => state.next);
    const previous = usePlayerStore((state) => state.previous);
    const isShuffle = usePlayerStore((state) => state.isShuffle);
    const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

    const baseIconClass = "text-[1.8em] w-8 cursor-pointer transition-all md:duration-300";
    const activeIconClass = "text-white scale-105";
    const inactiveIconClass = "text-white/50 hover:text-white";

    return (
        <div className="mx-auto flex w-full max-w-100 items-center justify-between">
            <FontAwesomeIcon
                icon={isMuted || volume === 0 ? faVolumeXmark : faVolumeHigh}
                onClick={onToggleMute}
                title={isMuted || volume === 0 ? "Unmute" : "Mute"}
                className={`${baseIconClass} ${isMuted ? activeIconClass : inactiveIconClass}`}
            />

            <button
                onClick={onToggleRepeat}
                title={isRepeat ? "Repeat Off" : "Repeat On"}
                className={`relative flex items-center justify-center ${baseIconClass} ${isRepeat ? activeIconClass : inactiveIconClass} cursor-pointer`}
            >
                <FontAwesomeIcon icon={faRepeat} className="relative z-0" />

                {isRepeat && (
                    <span className="absolute z-10 text-[10px] font-bold">
                        1
                    </span>
                )}
            </button>

            <FontAwesomeIcon
                icon={faBackwardStep}
                onClick={previous}
                title="Previous"
                className={`${baseIconClass} ${inactiveIconClass} hover:-translate-x-0.5`}
            />

            <button
                onClick={onTogglePlay}
                title={isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
                className="flex h-12 w-12 transform-gpu cursor-pointer items-center justify-center rounded-full bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.5)] transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <FontAwesomeIcon
                    icon={isLoading ? faCircleNotch : (isPlaying ? faPause : faPlay)}
                    spin={isLoading}
                    size="xl"
                    className={`${(!isPlaying && !isLoading) ? "ml-0.5" : ""}`}
                />
            </button>

            <FontAwesomeIcon
                icon={faForwardStep}
                onClick={next}
                title="Next"
                className={`${baseIconClass} ${inactiveIconClass} hover:translate-x-0.5`}
            />

            <FontAwesomeIcon
                icon={faShuffle}
                onClick={toggleShuffle}
                title={isShuffle ? "Shuffle Off" : "Shuffle On"}
                className={`${baseIconClass} ${isShuffle ? activeIconClass : inactiveIconClass}`}
            />

            <div className="relative flex items-center">
                <FontAwesomeIcon
                    icon={isDownloading ? faSpinner : faDownload}
                    spin={isDownloading}
                    onClick={!isDownloading ? onDownloadRequest : undefined}
                    title={isDownloading ? "Downloading..." : "Download"}
                    className={`${baseIconClass} ${isDownloading ? activeIconClass : inactiveIconClass} ${!streamingUrl ? "pointer-events-none" : ""}`}
                />
                {isDownloading && (
                    <span className="absolute -bottom-6.5 left-1/2 -translate-x-1/2 select-none rounded bg-black/50 text-xs text-white">
                        {downloadProgress}%
                    </span>
                )}
            </div>
        </div>
    );
}