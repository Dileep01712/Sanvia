import { useEffect, useState, useCallback } from "react";
import { onboarding, TooltipItem } from "@/lib/onboarding";
import OnboardingTooltip from "./OnboardingTooltip";

interface OnboardingTooltipManagerProps {
    id: string;
}

const TOOLTIPS: TooltipItem[] = [
    {
        id: "keyboard-shortcuts-tip",
        message: "Press ? to view keyboard shortcuts.",
        position: "center",
        context: "global",
        showArrow: false,
    },
    {
        id: "card-more-options-tip",
        message: "Long-press on any card for more options.",
        position: "left",
        context: "home",
    },
    {
        id: "toggle-sections-tip",
        message: "Tap the toggle to switch between views.",
        position: "top",
        context: "player",
    },
    {
        id: "swipe-to-queue-tip",
        message: "Long-press on any track for more options.",
        position: "center",
        context: "player",
    },
    {
        id: "swipe-to-remove-tip",
        message: "Swipe right to remove a track from your queue.",
        position: "center",
        context: "player",
    },
];

export default function OnboardingTooltipManager({ id }: OnboardingTooltipManagerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const currentTip = TOOLTIPS.find((t) => t.id === id);

    useEffect(() => {
        setIsTouch(
            window.matchMedia("(pointer: coarse)").matches ||
            "ontouchstart" in window
        );
    }, []);

    useEffect(() => {
        if (!currentTip) return;
        if (currentTip.id !== "keyboard-shortcuts-tip") return;
        if (onboarding.hasSeenTooltip(currentTip.id)) return;

        const isSmall = window.innerWidth < 1024;
        if (isTouch || isSmall) {
            onboarding.markTooltipAsSeen(currentTip.id);
        }
    }, [currentTip, isTouch]);

    const evaluateTooltipVisibility = useCallback(() => {
        if (!currentTip) {
            setIsVisible(false);
            return;
        }

        if (onboarding.hasSeenTooltip(currentTip.id)) {
            setIsVisible(false);
            return;
        }

        const sameContext = TOOLTIPS.filter(
            (t) => t.context === currentTip.context
        );
        const nextUnseen = onboarding.getNextUnseen(sameContext);

        if (nextUnseen?.id !== currentTip.id) {
            setIsVisible(false);
            return;
        }

        if (!onboarding.acquireLock(currentTip.id)) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
    }, [currentTip]);

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
        };
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

    const getDynamicMessage = (tipId: string, touchDevice: boolean) => {
        if (tipId === "toggle-sections-tip") {
            return touchDevice
                ? "Tap the toggle to switch between views."
                : "Click the toggle to switch between views.";
        }
        if (tipId === "swipe-to-queue-tip") {
            return touchDevice
                ? "Long-press on any track for more options."
                : "Right-click on any track for more options.";
        }
        if (tipId === "card-more-options-tip") {
            return touchDevice
                ? "Long-press on any card for more options."
                : "Right-click on any card for more options.";
        }
        return currentTip?.message || "";
    };

    if (!isVisible || !currentTip) return null;

    return (
        <OnboardingTooltip
            id={currentTip.id}
            message={getDynamicMessage(currentTip.id, isTouch)}
            position={currentTip.position}
            showArrow={currentTip.showArrow ?? true}
            onClose={handleClose}
        />
    );
}