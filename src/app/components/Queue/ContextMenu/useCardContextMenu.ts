"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;

export function useCardContextMenu(enabled = true) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const start = useRef<{ x: number; y: number } | null>(null);
    const firedAt = useRef(0);

    const clearTimer = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
        start.current = null;
    }, []);

    useEffect(() => clearTimer, [clearTimer]);

    const openMenu = useCallback(() => {
        firedAt.current = Date.now();
        navigator.vibrate?.(12);
        setOpen(true);
    }, []);

    const close = useCallback(() => setOpen(false), []);
    const show = useCallback(() => setOpen(true), []);

    const consumeLongPress = useCallback(() => {
        const justFired = Date.now() - firedAt.current < 600;
        if (justFired) firedAt.current = 0;
        return justFired;
    }, []);

    const bind = enabled
        ? {
            onContextMenu: (e: React.MouseEvent) => {
                e.preventDefault();
                clearTimer();
                openMenu();
            },
            onPointerDown: (e: React.PointerEvent) => {
                if (e.pointerType !== "touch") return;
                start.current = { x: e.clientX, y: e.clientY };
                timer.current = setTimeout(() => {
                    timer.current = null;
                    openMenu();
                }, LONG_PRESS_MS);
            },
            onPointerMove: (e: React.PointerEvent) => {
                const s = start.current;
                if (!s) return;
                if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) clearTimer();
            },
            onPointerUp: clearTimer,
            onPointerCancel: clearTimer,
        }
        : {};

    return { open: enabled && open, close, show, anchorRef, bind, consumeLongPress };
}