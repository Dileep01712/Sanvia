import { useEffect, useState } from "react";
import OnboardingTooltip from "./OnboardingTooltip";

interface TooltipItem {
    id: string;
    message: string;
    position: "top" | "center";
}

const tooltips: TooltipItem[] = [
    { id: "now-playing-first-msg", message: "Double-tap on the image to switch to gramophone view.", position: "center" },
    { id: "now-playing-second-msg", message: "Use the button to switch between sections.", position: "top" },
    { id: "third-msg", message: "Swipe left on a song to add it to Next in Queue.", position: "center" },
    { id: "fourth-msg", message: "Swipe right on a song to remove it from the Queue.", position: "center" }
];

const LOCK_KEY = "tooltip_currently_open";

export default function OnboardingTooltipManager({
    id,
    isExpanded
}: {
    id: string;
    isExpanded: boolean;
}) {
    const [currentTip, setCurrentTip] = useState<TooltipItem>();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const tip = tooltips.find(t => t.id === id);
        setCurrentTip(tip);
        setVisible(false);
    }, [id]);

    // helper: index of first unseen tooltip
    const getNextUnseenIndex = () => {
        for (let i = 0; i < tooltips.length; i++) {
            if (localStorage.getItem(`tooltip_seen_${tooltips[i].id}`) !== "true") return i;
        }
        return -1;
    };

    // cleanup stale lock conditions:
    // - owner not in tooltips
    // - owner tooltip already seen
    // - owner === this manager but isExpanded === false (we shouldn't hold lock if we can't show)
    const cleanupLockIfStale = () => {
        try {
            const owner = localStorage.getItem(LOCK_KEY);
            if (!owner) return;

            // owner not in our known list -> stale
            const ownerTip = tooltips.find(t => t.id === owner);
            if (!ownerTip) {
                localStorage.removeItem(LOCK_KEY);
                return;
            }

            // owner tooltip already seen -> release
            if (localStorage.getItem(`tooltip_seen_${owner}`) === "true") {
                localStorage.removeItem(LOCK_KEY);
                return;
            }

            // if owner is this manager but we are not expanded => release lock
            if (owner === id) {
                localStorage.removeItem(LOCK_KEY);
                return;
            }

        } catch (e) {
            console.warn("cleanupLockIfStale error:", e);
        }
    };

    // Attempt to show only when this manager's tooltip is the next unseen and lock is free.
    const tryShow = () => {
        if (!currentTip) return setVisible(false);

        // If already seen -> nothing
        if (localStorage.getItem(`tooltip_seen_${currentTip.id}`) === "true") {
            setVisible(false);
            return;
        }

        const nextIndex = getNextUnseenIndex();
        if (nextIndex === -1) {
            setVisible(false);
            return;
        }

        // only the manager responsible for the first unseen tooltip should show
        if (tooltips[nextIndex].id !== currentTip.id) {
            setVisible(false);
            return;
        }

        // cleanup any obvious stale locks before attempting to acquire
        cleanupLockIfStale();

        const active = localStorage.getItem(LOCK_KEY);
        if (!active) {
            try {
                // Acquire the lock only if we will show it (so we don't hold a lock while invisible)
                localStorage.setItem(LOCK_KEY, currentTip.id);
                setVisible(true);
            } catch (e) {
                console.warn("Failed to acquire lock:", e);
                setVisible(false);
            }
        } else {
            setVisible(false);
        }
    };

    // run cleanup once on mount (helps if leftover stale lock exists)
    useEffect(() => {
        cleanupLockIfStale();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // try to show when tip
    useEffect(() => {
        tryShow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTip, isExpanded]);

    // listen for storage events (other tabs) and a custom event for same-tab updates
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (!e.key || e.key === LOCK_KEY || e.key.startsWith("tooltip_seen_")) {
                cleanupLockIfStale();
                tryShow();
            }
        };
        const onCustom = () => {
            cleanupLockIfStale();
            tryShow();
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener("tooltip_update", onCustom);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("tooltip_update", onCustom);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTip, isExpanded]);

    const handleClose = () => {
        if (!currentTip) return;
        localStorage.setItem(`tooltip_seen_${currentTip.id}`, "true");
        setVisible(false);

        // release lock if we own it
        try {
            const owner = localStorage.getItem(LOCK_KEY);
            if (owner === currentTip.id) {
                localStorage.removeItem(LOCK_KEY);
            }
        } catch (e) {
            console.warn("Error releasing lock:", e);
        }

        window.dispatchEvent(new Event("tooltip_update"));
    };

    if (!visible || !currentTip || !isExpanded) return null;

    return (
        <OnboardingTooltip
            id={currentTip.id}
            message={currentTip.message}
            position={currentTip.position}
            isExpanded={isExpanded}
            onClose={handleClose}
        />
    );
}
