import { useEffect, useState, useCallback } from "react";
import { onboarding } from "@/lib/onboarding";
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
    const [isVisible, setIsVisible] = useState(false);
    const currentTip = TOOLTIPS.find(t => t.id === id);

    const isExpanded = usePlayerStore((state) => state.isExpanded);

    const evaluateTooltipVisibility = useCallback(() => {
        if (!currentTip || !isExpanded) {
            setIsVisible(false);
            return
        }

        if (onboarding.hasSeenTooltip(currentTip.id)) {
            setIsVisible(false);
            return;
        }

        const nextUnseen = onboarding.getNextUnseen(TOOLTIPS);
        if (nextUnseen?.id !== currentTip.id) {
            setIsVisible(false);
            return;
        }

        if (!onboarding.acquireLock(currentTip.id)) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
    }, [currentTip, isExpanded]);

    useEffect(() => {
        return () => {
            if (currentTip) onboarding.releaseLock(currentTip.id);
        };
    }, [currentTip]);

    useEffect(() => {
        const handleStorageChange = () => evaluateTooltipVisibility();
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("tooltip_update", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("tooltip_update", handleStorageChange);
        }
    }, [evaluateTooltipVisibility]);

    useEffect(() => {
        evaluateTooltipVisibility();
    }, [evaluateTooltipVisibility]);

    const handleClose = () => {
        if (currentTip) {
            onboarding.markTooltipAsSeen(currentTip.id);
            onboarding.releaseLock(currentTip.id);
        }

        setIsVisible(false);
    };

    if (!isVisible || !currentTip || !isExpanded) return null;

    return (
        <OnboardingTooltip
            id={currentTip.id}
            message={currentTip.message}
            position={currentTip.position}
            onClose={handleClose}
        />
    );
}
