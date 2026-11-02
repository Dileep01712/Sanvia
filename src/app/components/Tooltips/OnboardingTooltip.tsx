import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { TooltipItem } from "@/lib/onboarding";

interface OnboardingTooltipProps {
    id: string;
    message: string;
    position: TooltipItem["position"];
    showArrow?: boolean;
    onClose: () => void;
}

export default function OnboardingTooltip({
    id,
    message,
    position,
    showArrow = true,
    onClose,
}: OnboardingTooltipProps) {
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const centerTop = position === "center" && !showArrow ? "top-[22%]" : "";

    const positionClasses =
        position === "top"
            ? "bottom-5.75 md:bottom-5.25"
            : position === "center"
                ? `left-1/2 -translate-x-1/2 ${centerTop}`
                : position === "left"
                    ? "left-5 md:left-8"
                    : "";

    return (
        <div
            ref={tooltipRef}
            className={`absolute z-40 w-80 p-2 sm:w-87.5 md:w-92.5 lg:w-100 rounded-2xl border border-white/50 bg-zinc-800 text-white shadow-md text-center font-sans font-normal select-none ${positionClasses}`}
        >
            {showArrow && (
                <div
                    className={`absolute -bottom-1.5 z-10 h-3 w-3 rotate-45 rounded-br-[2px] border-b border-r border-white/50 bg-zinc-800
                        ${position === "center"
                            ? "left-1/2 -translate-x-1/2"
                            : position === "top"
                                ? "left-[calc(50%+13.8px)] -translate-x-1/2"
                                : "left-1/5 md:left-1/4"
                        }
                    `}
                />
            )}

            <div
                id={id}
                className="flex justify-between items-center gap-2 pl-3 pr-1 py-1"
            >
                <span className="text-sm leading-tight text-white/95 text-left">
                    {message}
                </span>
                <Button
                    onClick={onClose}
                    className="ml-1 h-7 shrink-0 cursor-pointer rounded-full border-none bg-white/10 px-3.5 py-0 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus-visible:ring-1 focus-visible:ring-white/40"
                >
                    Got it
                </Button>
            </div>
        </div>
    );
}