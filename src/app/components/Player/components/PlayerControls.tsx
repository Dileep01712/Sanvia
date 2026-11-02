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
    faXmark,
    faVolumeXmark,
    faVolumeHigh
} from "@fortawesome/free-solid-svg-icons";

interface PlayerControlsProps {
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
    onCancelDownload?: () => void;
}

export default function PlayerControls({
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
    onCancelDownload,
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
                icon={isMuted ? faVolumeXmark : faVolumeHigh}
                onClick={onToggleMute}
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
                className={`${baseIconClass} ${isMuted ? activeIconClass : inactiveIconClass}`}
            />

            <button
                onClick={onToggleRepeat}
                title={isRepeat ? "Repeat Off (R)" : "Repeat On (R)"}
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
                title="Previous (Ctrl + ←)"
                className={`${baseIconClass} ${inactiveIconClass} hover:-translate-x-0.5`}
            />

            <button
                onClick={onTogglePlay}
                title={isLoading ? "Loading..." : isPlaying ? "Pause (Space)" : "Play (Space)"}
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
                title="Next (Ctrl + →)"
                className={`${baseIconClass} ${inactiveIconClass} hover:translate-x-0.5`}
            />

            <FontAwesomeIcon
                icon={faShuffle}
                onClick={toggleShuffle}
                title={isShuffle ? "Shuffle Off (S)" : "Shuffle On (S)"}
                className={`${baseIconClass} ${isShuffle ? activeIconClass : inactiveIconClass}`}
            />

            <div className="relative flex items-center justify-center">
                {isDownloading ? (
                    <button
                        type="button"
                        onClick={onCancelDownload}
                        title="Cancel download (Shift + C)"
                        className={`group flex items-center justify-center ${baseIconClass} ${activeIconClass}`}
                    >
                        <span className="hidden md:flex md:items-center md:justify-center md:group-hover:hidden">
                            <FontAwesomeIcon icon={faSpinner} spin />
                        </span>

                        <span className="flex items-center justify-center md:hidden md:group-hover:flex">
                            <FontAwesomeIcon icon={faXmark} />
                        </span>
                    </button>
                ) : (
                    <FontAwesomeIcon
                        icon={faDownload}
                        onClick={onDownloadRequest}
                        title="Download (Shift + D)"
                        className={`${baseIconClass} ${inactiveIconClass} ${!streamingUrl ? "pointer-events-none" : ""}`}
                    />
                )}

                {isDownloading && (
                    <span className="pointer-events-none absolute -bottom-6.5 left-1/2 -translate-x-1/2 select-none rounded bg-black/50 text-xs text-white">
                        {downloadProgress}%
                    </span>
                )}
            </div>
        </div>
    );
}