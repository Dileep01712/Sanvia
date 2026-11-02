"use client";

import { useEffect } from "react";

export default function GlobalContextMenuGuard() {
    useEffect(() => {
        const onContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("input, textarea, [contenteditable='true'], [data-native-menu]")) {
                return;
            }
            e.preventDefault();
        };

        document.addEventListener("contextmenu", onContextMenu);
        return () => document.removeEventListener("contextmenu", onContextMenu);
    }, []);

    return null;
}