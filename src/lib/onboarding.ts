const SEEN_PREFIX = "tooltip_v2_seen_";
const LOCK_KEY = "tooltip_v2_currently_open";

const OLD_PREFIX = "tooltip_seen_";
const OLD_LOCK_KEY = "tooltip_currently_open";

export type TooltipContext = "global" | "home" | "player";

export interface TooltipItem {
    id: string;
    message: string;
    position: "top" | "center" | "left";
    context: TooltipContext;
    showArrow?: boolean;
}

export const onboarding = {
    cleanupLegacyTooltips() {
        if (typeof window === "undefined") return;

        localStorage.removeItem(OLD_LOCK_KEY);
        sessionStorage.removeItem(OLD_LOCK_KEY);

        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(OLD_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
    },

    hasSeenTooltip(id: string): boolean {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(SEEN_PREFIX + id) === "true";
    },

    markTooltipAsSeen(id: string) {
        if (typeof window === "undefined") return;
        localStorage.setItem(SEEN_PREFIX + id, "true");
        window.dispatchEvent(new Event("tooltip_update"));
    },

    acquireLock(id: string): boolean {
        if (typeof window === "undefined") return false;
        const current = sessionStorage.getItem(LOCK_KEY);
        if (current === id) return true;
        if (current) return false;
        sessionStorage.setItem(LOCK_KEY, id);
        return true;
    },

    releaseLock(id: string) {
        if (typeof window === "undefined") return;
        if (sessionStorage.getItem(LOCK_KEY) === id) {
            sessionStorage.removeItem(LOCK_KEY);
            window.dispatchEvent(new Event("tooltip_update"));
        }
    },

    getNextUnseen(tooltips: TooltipItem[]): TooltipItem | null {
        for (const t of tooltips) {
            if (!this.hasSeenTooltip(t.id)) return t;
        }
        return null;
    },

    resetAll(tooltips: TooltipItem[]) {
        if (typeof window === "undefined") return;
        tooltips.forEach((t) => localStorage.removeItem(SEEN_PREFIX + t.id));
        sessionStorage.removeItem(LOCK_KEY);
        window.dispatchEvent(new Event("tooltip_update"));
    },
};