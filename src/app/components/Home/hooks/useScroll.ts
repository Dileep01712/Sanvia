import { useState, useEffect, useCallback } from "react";

export const useScroll = (): { isScrolled: boolean } => {
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    const handleScroll = useCallback(() => {
        setIsScrolled(window.scrollY > 0);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return { isScrolled };
};
