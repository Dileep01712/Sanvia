import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/usePlayerStore";

interface OnboardingTooltipProps {
    id: string;
    message: string;
    position: "top" | "center";
    onClose: () => void;
}

export default function OnboardingTooltip({
    id,
    message,
    position,
    onClose,
}: OnboardingTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);

    const isExpanded = usePlayerStore((state) => state.isExpanded);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isExpanded) {
            window.addEventListener("keydown", handleKey);
            return () => window.removeEventListener("keydown", handleKey);
        }
    }, [isExpanded, onClose]);

    const positionClasses =
        position === "top"
            ? "bottom-4"
            : position === "center"
                ? "left-1/2 -translate-x-1/2 top-2"
                : "";

    return (
        <div
            ref={tooltipRef}
            className={
                isExpanded
                    ? `absolute z-50 w-80 p-2 sm:w-87.5 sm:p-3 md:w-92.5 md:p-4 lg:w-100 lg:p-5 rounded-2xl bg-zinc-700 backdrop-blur-md text-center font-sans font-normal text-white select-none ${positionClasses}`
                    : "hidden"
            }
        >
            <svg viewBox="0 0 16 8"
                className={`absolute left-1/2 translate-x-1/2 -bottom-2 w-4 h-2 text-zinc-700 
                    ${position === "top"
                        ? "-ml-0.5"
                        : "ml-0"
                    }
                `}
            >
                <path d="M0 0L8 8L16 0Z" fill="currentColor" />
            </svg>

            <div
                id={id}
                className="flex justify-between items-center gap-3"
            >
                <span>{message}</span>
                <Button
                    onClick={onClose}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                >
                    Got it
                </Button>
            </div>
        </div>
    );
}
