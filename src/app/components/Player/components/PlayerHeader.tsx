import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faAngleUp, faX } from "@fortawesome/free-solid-svg-icons";
import { usePlayerStore } from "@/store/usePlayerStore";

interface ModalHeaderProps {
    onToggleExpand: () => void;
    onClose: () => void;
}

export default function ModalHeader({ onToggleExpand, onClose }: ModalHeaderProps) {
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const isExpanded = usePlayerStore((state) => state.isExpanded);

    useEffect(() => {
        const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    return (
        <div className={`flex z-50 
            ${isExpanded
                ? "w-full justify-center items-center"
                : "absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex-col gap-1.5"
            }
        `}>
            <Button
                title={isLargeScreen
                    ? isExpanded
                        ? "Collapse (Ctrl + Arrow Down)"
                        : "Expand (Ctrl + Arrow Up)"
                    : isExpanded
                        ? "Collapse" : "Expand"
                }
                onClick={onToggleExpand}
                className={`text-white bg-transparent hover:bg-transparent shadow-none focus:outline-none opacity-70 hover:opacity-100 transition-opacity p-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] cursor-pointer
                    ${isExpanded
                        ? "absolute transform -translate-x-full w-9 h-9"
                        : "w-8 h-8"
                    }
                `}
            >
                <FontAwesomeIcon icon={isExpanded ? faAngleDown : faAngleUp} className="w-5 h-5" />
            </Button>

            <Button
                title={isLargeScreen ? "Close (Ctrl + X)" : "Close"}
                onClick={onClose}
                className={`text-white bg-transparent hover:bg-transparent shadow-none focus:outline-none opacity-70 hover:opacity-100 transition-opacity p-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] cursor-pointer
                    ${isExpanded ? "absolute transform translate-x-full w-9 h-9" : "w-8 h-8"}
                `}
            >
                <FontAwesomeIcon icon={faX} className="w-4 h-4" />
            </Button>
        </div>
    );
}