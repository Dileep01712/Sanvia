"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const SHORTCUT_CATEGORIES = [
    {
        title: "Playback",
        items: [
            { action: "Play / Pause", keys: ["Space"] },
            { action: "Next song", keys: ["Ctrl", "→"] },
            { action: "Previous song", keys: ["Ctrl", "←"] },
            { action: "Forward 5 seconds", keys: ["→"] },
            { action: "Back 5 seconds", keys: ["←"] },
        ],
    },
    {
        title: "Controls",
        items: [
            { action: "Repeat", keys: ["R"] },
            { action: "Shuffle", keys: ["S"] },
            { action: "Mute / Unmute", keys: ["M"] },
            { action: "Sleep timer", keys: ["T"] },
            { action: "Download song", keys: ["Shift", "D"] },
            { action: "Cancel download", keys: ["Shift", "C"] },
        ],
    },
    {
        title: "Player window",
        items: [
            { action: "Expand player", keys: ["Ctrl", "↑"] },
            { action: "Collapse player", keys: ["Ctrl", "↓"] },
            { action: "Close player", keys: ["Ctrl", "X"] },
            { action: "Next view (Queue/Related)", keys: ["Shift", "→"] },
            { action: "Previous view", keys: ["Shift", "←"] },
        ],
    },
    {
        title: "General",
        items: [
            { action: "Search music", keys: ["Ctrl", "M"] },
            { action: "Close menu or popup", keys: ["Esc"] },
            { action: "Show shortcuts", keys: ["?"] },
        ],
    },
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="flex h-6 min-w-6 items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 font-sans text-xs font-medium text-white/70 shadow-sm">
        {children}
    </kbd>
);

export default function KeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";

            const handleModalKeys = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    setIsOpen(false);
                } else {
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.key.startsWith('F')) {
                        e.preventDefault();
                    }
                }
            };

            window.addEventListener("keydown", handleModalKeys, { capture: true });

            return () => {
                document.body.style.overflow = originalOverflow;
                window.removeEventListener("keydown", handleModalKeys, { capture: true });
            };
        } else {
            const handleGlobalKeys = (e: KeyboardEvent) => {
                if (window.innerWidth < 768) return;

                const target = e.target as HTMLElement;
                if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

                if (e.key === "?" || (e.shiftKey && e.key === "/")) {
                    e.preventDefault();
                    setIsOpen(true);
                }
            };

            window.addEventListener("keydown", handleGlobalKeys);
            return () => window.removeEventListener("keydown", handleGlobalKeys);
        }
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 hidden items-center justify-center md:flex select-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur"
                        onClick={() => setIsOpen(false)}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/95 shadow-2xl ring-1 ring-inset ring-white/10"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
                            <h2 className="font-display text-lg font-bold text-white/90">
                                Keyboard Shortcuts
                            </h2>
                            <div className="flex items-center gap-2">
                                <Kbd>Esc</Kbd>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-8 p-6">
                            {SHORTCUT_CATEGORIES.map((category) => (
                                <div key={category.title}>
                                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                                        {category.title}
                                    </h3>
                                    <ul className="space-y-3">
                                        {category.items.map((item) => (
                                            <li
                                                key={item.action}
                                                className="flex items-center justify-between gap-4"
                                            >
                                                <span className="text-sm font-medium text-white/80">
                                                    {item.action}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {item.keys.map((key, idx) => (
                                                        <div key={idx} className="flex items-center gap-1">
                                                            {idx > 0 && (
                                                                <span className="text-xs font-medium text-white/30">
                                                                    +
                                                                </span>
                                                            )}
                                                            <Kbd>{key}</Kbd>
                                                        </div>
                                                    ))}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}