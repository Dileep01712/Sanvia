const SEEN_PREFIX = "tooltip_seen_";
const LOCK_KEY = "tooltip_currently_open";

export interface TooltipItem {
    id: string;
    message: string;
    position: "top" | "center";
}

export const onborading = {
    isSeen(id: string): boolean {
        return localStorage.getItem(SEEN_PREFIX + id) === "true";
    },

    markSeen(id: string) {
        localStorage.setItem(SEEN_PREFIX + id, "true");
        window.dispatchEvent(new Event("tooltip_update"));
    },

    acquireLock(id: string): boolean {
        const current = localStorage.getItem(LOCK_KEY);
        if (current === id) return true;
        if (current) return false;
        localStorage.setItem(LOCK_KEY, id);
        return true;
    },

    releaseLock(id: string) {
        if (localStorage.getItem(LOCK_KEY) === id) {
            localStorage.removeItem(LOCK_KEY);
            window.dispatchEvent(new Event("tooltip_update"));
        }
    },

    getNextUnseen(tooltips: TooltipItem[]): TooltipItem | null {
        for (const t of tooltips) {
            if (!this.isSeen(t.id)) return t;
        }
        return null;
    }
}