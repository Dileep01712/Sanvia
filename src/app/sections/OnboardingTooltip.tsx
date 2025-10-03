import { Button } from "@/components/ui/button";

interface OnboardingTooltipProps {
    id: string;
    message: string;
    position: "top" | "center";
    isExpanded: boolean;
    onClose: () => void;
}

export default function OnboardingTooltip({
    id,
    message,
    position,
    isExpanded,
    onClose,
}: OnboardingTooltipProps) {

    const positionClasses =
        position === "top"
            ? "bottom-full mb-2"
            : position === "center"
                ? "left-1/2 -translate-x-1/2 top-20"
                : "";

    return (
        <div className={isExpanded ? `absolute md:w-[400px] md-range:w-[370px] sm-range:w-[350px] w-[310px] z-50 md:p-5 md-range:p-4 sm-range:p-3 p-2 bg-zinc-950 text-white text-center rounded-md border-2 border-white font-Lato select-none ${positionClasses}` : "hidden"}>
            <div className={`absolute left-1/2 -bottom-[7px] w-3 h-3 rotate-45 bg-zinc-950 border-b-2 border-r-2 border-white ${position === "top" ? "ml-2.5" : "ml-0"}`} />
            <div id={id} className="flex justify-between items-center gap-3">
                <span>{message}</span>
                <Button variant="secondary" onClick={onClose}>OK</Button>
            </div>
        </div>
    );
}
