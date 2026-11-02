"use client";

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCircleInfo, faXmark } from "@fortawesome/free-solid-svg-icons";

export const MENU_ITEM_CLASS =
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export function InfoRow({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50">
                {label}
            </dt>
            <dd className="mt-0.5 line-clamp-2 wrap-break-word text-sm text-white/90">
                {value}
            </dd>
        </div>
    );
}

export function InfoLine({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <div className="flex items-start justify-between gap-2 text-xs">
            <dt className="shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                {label}
            </dt>
            <dd className="wrap-break-word text-right text-sm font-medium tabular-nums text-white/90">
                {value}
            </dd>
        </div>
    );
}

function getAnchorLayoutWidth(el: HTMLElement): number {
    const cs = getComputedStyle(el);
    const offsetW = el.offsetWidth;
    const cssWidth = parseFloat(cs.width);

    if (Number.isFinite(cssWidth) && cssWidth > 0) {
        let layoutWidth: number;
        if (cs.boxSizing === "border-box") {
            layoutWidth = cssWidth;
        } else {
            layoutWidth =
                cssWidth +
                parseFloat(cs.paddingLeft) +
                parseFloat(cs.paddingRight) +
                parseFloat(cs.borderLeftWidth) +
                parseFloat(cs.borderRightWidth);
        }

        if (offsetW && Math.abs(layoutWidth - offsetW) > 2) {
            return offsetW;
        }
        return layoutWidth;
    }

    return offsetW || el.getBoundingClientRect().width;
}

interface ContextMenuShellProps {
    anchorRef: { current: HTMLElement | null };
    onClose: () => void;
    children: ReactNode;
}

export function ContextMenuShell({ anchorRef, onClose, children }: ContextMenuShellProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const lockedRectRef = useRef<{ centerX: number; centerY: number; width: number } | null>(null);
    const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

    const place = useCallback(() => {
        const anchor = anchorRef.current;
        const menu = menuRef.current;
        if (!anchor || !menu) return;

        const margin = 8;
        const viewportWidth = document.documentElement.clientWidth;

        if (!lockedRectRef.current) {
            const rect = anchor.getBoundingClientRect();
            lockedRectRef.current = {
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                width: Math.min(
                    getAnchorLayoutWidth(anchor),
                    viewportWidth - margin * 2
                ),
            };
        }

        const { centerX, centerY, width } = lockedRectRef.current;
        const height = menu.getBoundingClientRect().height;

        const left = Math.max(
            margin,
            Math.min(centerX - width / 2, viewportWidth - width - margin)
        );
        const top = Math.max(
            margin,
            Math.min(centerY - height / 2, window.innerHeight - height - margin)
        );

        setPos((prev) =>
            prev &&
                Math.abs(prev.left - left) < 0.01 &&
                Math.abs(prev.top - top) < 0.01 &&
                Math.abs(prev.width - width) < 0.01
                ? prev
                : { top, left, width }
        );
    }, [anchorRef]);

    useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const menu = menuRef.current;
        if (!anchor || !menu) return;

        if (!lockedRectRef.current) {
            const rect = anchor.getBoundingClientRect();
            const viewportWidth = document.documentElement.clientWidth;
            lockedRectRef.current = {
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2,
                width: Math.min(
                    getAnchorLayoutWidth(anchor),
                    viewportWidth - 8 * 2
                ),
            };
        }
        menu.style.width = `${lockedRectRef.current.width}px`;
        menu.style.visibility = "hidden";

        place();

        const observer = new ResizeObserver(place);
        observer.observe(menu);
        return () => observer.disconnect();
    }, [anchorRef, place]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || (e.ctrlKey && e.key === "ArrowUp")) {
                onClose();
            }
        };

        window.addEventListener("scroll", onClose, true);
        window.addEventListener("resize", onClose);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("scroll", onClose, true);
            window.removeEventListener("resize", onClose);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose]);

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-60"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }}
            />

            <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.12 }}
                style={{
                    top: pos?.top ?? 0,
                    left: pos?.left ?? 0,
                    width: pos?.width ?? 208,
                    visibility: pos ? "visible" : "hidden",
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                className="fixed z-61 flex flex-col gap-1 select-none overflow-hidden rounded-2xl bg-black/75 p-1.5 shadow-2xl ring-1 ring-inset ring-white/15 backdrop-blur-xl"
            >
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl">
                    <span className="select-none text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        Options
                    </span>
                    <button
                        type="button"
                        aria-label="Close"
                        title="Close (Esc)"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-xs mr-px" />
                    </button>
                </div>

                <div className="mx-1.5 my-0.5 h-px bg-white/10" />

                {children}
            </motion.div>
        </>,
        document.body
    );
}

export function InfoDrawer({
    showInfo,
    onToggle,
    children,
}: {
    showInfo: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <>
            <div className="mx-1.5 my-0.5 h-px bg-white/10" />

            <button
                type="button"
                role="menuitem"
                aria-expanded={showInfo}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={MENU_ITEM_CLASS}
            >
                <FontAwesomeIcon icon={faCircleInfo} className="w-4 shrink-0 text-white/70" />
                <span className="flex-1 truncate text-left">Info</span>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`text-xs text-white/50 transition-transform ${showInfo ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {showInfo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden rounded-xl"
                    >
                        <dl className="space-y-2.5 px-3 pb-2 pt-1.5">{children}</dl>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}