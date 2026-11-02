"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SeekSide = "left" | "right";

export interface SeekState {
    side: SeekSide;
    total: number;
    id: number;
}

export function useSeekIndicator(hideAfterMs = 1000) {
    const [seek, setSeek] = useState<SeekState | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showSeek = useCallback(
        (side: SeekSide, seconds: number) => {
            setSeek((prev) => ({
                side,
                total: prev && prev.side === side ? prev.total + seconds : seconds,
                id: (prev?.id ?? 0) + 1,
            }));

            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setSeek(null), hideAfterMs);
        },
        [hideAfterMs]
    );

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        []
    );

    return { seek, showSeek };
}
