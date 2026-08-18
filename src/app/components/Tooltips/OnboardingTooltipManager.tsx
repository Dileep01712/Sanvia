import { useEffect, useState, useCallback } from "react";
import { onborading } from "@/lib/onboarding";
import OnboardingTooltip from "./OnboardingTooltip";
import { usePlayerStore } from "@/store/usePlayerStore";

interface TooltipItem {
    id: string;
    message: string;
    position: "top" | "center";
}

interface OnboardingTooltipManagerProps {
    id: string;
}

const TOOLTIPS: TooltipItem[] = [
    {
        id: "toggle-sections-tip",
        message: "Tap the toggle to switch between views.",
        position: "top"
    },
    {
        id: "swipe-to-queue-tip",
        message: "Swipe left on any track to play it next.",
        position: "center"
    },
    {
        id: "swipe-to-remove-tip",
        message: "Swipe right to remove a track from your queue.",
        position: "center"
    }
];

export default function OnboardingTooltipManager({ id }: OnboardingTooltipManagerProps) {
    const [visible, setVisible] = useState(false);
    const currentTip = TOOLTIPS.find(t => t.id === id);

    const isExpanded = usePlayerStore((state) => state.isExpanded);

    const tryShow = useCallback(() => {
        if (!currentTip || !isExpanded) {
            setVisible(false);
            return
        }

        if (onborading.isSeen(currentTip.id)) {
            setVisible(false);
            return;
        }

        const nextUnseen = onborading.getNextUnseen(TOOLTIPS);
        if (nextUnseen?.id !== currentTip.id) {
            setVisible(false);
            return;
        }

        if (!onborading.acquireLock(currentTip.id)) {
            setVisible(false);
            return;
        }

        setVisible(true);
    }, [currentTip, isExpanded]);

    useEffect(() => {
        return () => {
            if (currentTip) onborading.releaseLock(currentTip.id);
        };
    }, [currentTip]);

    useEffect(() => {
        const update = () => tryShow();
        window.addEventListener("storage", update);
        window.addEventListener("tooltip_update", update);

        return () => {
            window.removeEventListener("storage", update);
            window.removeEventListener("tooltip_update", update);
        }
    }, [tryShow]);

    useEffect(() => {
        tryShow();
    }, [tryShow]);

    const handleClose = () => {
        if (currentTip) {
            onborading.markSeen(currentTip.id);
            onborading.releaseLock(currentTip.id);
        }

        setVisible(false);
    };

    if (!visible || !currentTip || !isExpanded) return null;

    return (
        <OnboardingTooltip
            id={currentTip.id}
            message={currentTip.message}
            position={currentTip.position}
            onClose={handleClose}
        />
    );
}
