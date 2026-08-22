import { useState, useEffect, useCallback } from "react";

const VALID_INPUT_QUERY_REGEX = /^[\u0900-\u097Fa-zA-Z0-9 ()"]+$/;

interface UseHomeSearchReturn {
    inputQuery: string;
    setInputQuery: React.Dispatch<React.SetStateAction<string>>;
    searchQuery: string;
    isSearchActive: boolean;
    isValidQuery: boolean;
    isScrolled: boolean;
    closeSearch: () => void;
    handleSearchSubmit: () => void;
}

export const useHomeSearch = (): UseHomeSearchReturn => {
    const [inputQuery, setInputQuery] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
    const [isValidQuery, setIsValidQuery] = useState<boolean>(true);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    const handleScroll = useCallback(() => {
        setIsScrolled(window.scrollY > 0);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const closeSearch = useCallback(() => {
        setInputQuery("");
        setSearchQuery("");
        setIsSearchActive(false);
        setIsValidQuery(true);
    }, []);

    useEffect(() => {
        const sanitizedQuery = inputQuery.trim();

        if (!sanitizedQuery) {
            setIsValidQuery(true);
            setSearchQuery("");
            return;
        }

        if (VALID_INPUT_QUERY_REGEX.test(sanitizedQuery)) {
            setIsValidQuery(true);
        } else {
            setIsValidQuery(false);
        }
    }, [inputQuery]);

    const handleSearchSubmit = useCallback(() => {
        const sanitizedQuery = inputQuery.trim();

        if (!sanitizedQuery) {
            setSearchQuery("");
            setIsSearchActive(true);
        } else if (VALID_INPUT_QUERY_REGEX.test(sanitizedQuery)) {
            setSearchQuery(sanitizedQuery);
            setIsSearchActive(true);
        }
    }, [inputQuery]);

    return {
        inputQuery,
        setInputQuery,
        searchQuery,
        isSearchActive,
        isValidQuery,
        isScrolled,
        closeSearch,
        handleSearchSubmit,
    };
};