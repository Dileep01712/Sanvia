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

    const baseIcon = "text-[1.8em] w-8 cursor-pointer transition-all md:duration-300";
    const activeIcon = "text-white drop-shadow-[0_0_8px_rgba(96,165,250,0.6)] scale-105";
    const inactiveIcon = "text-white/50 hover:text-white";

    return (
        <div className="mx-auto flex w-full max-w-100 items-center justify-between">
            <FontAwesomeIcon
                icon={isMuted || volume === 0 ? faVolumeXmark : faVolumeHigh}
                onClick={onToggleMute}
                title={isMuted || volume === 0 ? "Unmute" : "Mute"}
                className={`${baseIcon} ${isMuted ? activeIcon : inactiveIcon}`}
            />

            <FontAwesomeIcon
                icon={faRepeat}
                onClick={onToggleRepeat}
                title={isRepeat ? "Repeat Off" : "Repeat On"}
                className={`${baseIcon} ${isRepeat ? activeIcon : inactiveIcon}`}
            />

            <FontAwesomeIcon
                icon={faBackwardStep}
                onClick={previous}
                title="Previous"
                className={`${baseIcon} ${inactiveIcon} hover:-translate-x-0.5`}
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
                className={`${baseIcon} ${inactiveIcon} hover:translate-x-0.5`}
            />

            <FontAwesomeIcon
                icon={faShuffle}
                onClick={toggleShuffle}
                title={isShuffle ? "Shuffle Off" : "Shuffle On"}
                className={`${baseIcon} ${isShuffle ? activeIcon : inactiveIcon}`}
            />

            <div className="relative flex items-center">
                <FontAwesomeIcon
                    icon={isDownloading ? faSpinner : faDownload}
                    spin={isDownloading}
                    onClick={!isDownloading ? onDownloadRequest : undefined}
                    title={isDownloading ? "Downloading..." : "Download"}
                    className={`${baseIcon} ${isDownloading ? activeIcon : inactiveIcon} ${!streamingUrl ? "pointer-events-none" : ""}`}
                />
                {isDownloading && (
                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 select-none rounded bg-black/50 px-px text-xs text-white">
                        {downloadProgress}%
                    </span>
                )}
            </div>
        </div>
    );
}