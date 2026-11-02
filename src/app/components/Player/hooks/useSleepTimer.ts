import { useCallback, useEffect, useRef, useState } from "react";

export type SleepMode = "off" | "timer" | "song";

const TICK_MS = 250;
const FADE_SECONDS = 10;
const SONG_END_PAUSE_SECONDS = 0.5;
const MAX_MS = 2 * 60 * 60 * 1000;

function formatRemaining(ms: number, maxMs = MAX_MS): string {
    const boundedMs = Math.min(Math.max(0, ms), maxMs);

    const totalSeconds = Math.ceil(boundedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    if (hours > 0) {
        const formattedHours = String(hours).padStart(2, "0");
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    return `${formattedMinutes}:${formattedSeconds}`;
}

function fadeScaleFor(secondsLeft: number): number {
    return Math.min(1, Math.max(0, Math.ceil(secondsLeft) / FADE_SECONDS));
}

export function useSleepTimer(
    audioRef: { current: HTMLAudioElement | null },
    onSleep: () => void,
    setFadeScale: (scale: number) => void
) {
    const [mode, setMode] = useState<SleepMode>("off");
    const [label, setLabel] = useState("");

    const endAtRef = useRef(0);
    const onSleepRef = useRef(onSleep);

    useEffect(() => {
        onSleepRef.current = onSleep;
    });

    const cancel = useCallback(() => {
        setFadeScale(1);
        setMode("off");
        setLabel("");
    }, [setFadeScale]);

    const finish = useCallback(() => {
        onSleepRef.current();
        cancel();
    }, [cancel]);

    const start = useCallback(
        (minutes: number) => {
            setFadeScale(1);
            const ms = Math.min(minutes * 60_000, MAX_MS);
            endAtRef.current = Date.now() + ms;
            setLabel(formatRemaining(ms));
            setMode("timer");
        },
        [setFadeScale]
    );

    const startAtSongEnd = useCallback(() => {
        setFadeScale(1);
        setLabel("End of song");
        setMode("song");
    }, [setFadeScale]);

    const extend = useCallback(
        (minutes: number) => {
            if (mode !== "timer") return;
            const now = Date.now();
            endAtRef.current = Math.min(
                endAtRef.current + minutes * 60_000,
                now + MAX_MS
            );
            setFadeScale(1);
            setLabel(formatRemaining(endAtRef.current - now));
        },
        [mode, setFadeScale]
    );

    useEffect(() => {
        if (mode !== "timer") return;

        const id = setInterval(() => {
            const remaining = endAtRef.current - Date.now();
            if (remaining <= 0) {
                finish();
                return;
            }

            if (remaining <= FADE_SECONDS * 1000) {
                setFadeScale(fadeScaleFor(remaining / 1000));
            }

            const next = formatRemaining(remaining);
            setLabel((prev) => (prev === next ? prev : next));
        }, TICK_MS);

        return () => clearInterval(id);
    }, [mode, setFadeScale, finish]);

    useEffect(() => {
        if (mode !== "song") return;

        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            const duration = audio.duration;
            if (!Number.isFinite(duration) || duration <= 0) return;

            const remaining = duration - audio.currentTime;
            if (remaining <= SONG_END_PAUSE_SECONDS) {
                finish();
                return;
            }
            if (remaining <= FADE_SECONDS) {
                setFadeScale(fadeScaleFor(remaining));
            }
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        return () => audio.removeEventListener("timeupdate", onTimeUpdate);
    }, [mode, audioRef, setFadeScale, finish]);

    return { mode, label, start, startAtSongEnd, extend, cancel };
}