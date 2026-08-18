import { useState, useEffect, useCallback } from "react";

const VALID_INPUT_QUERY_REGEX = /^[\u0900-\u097Fa-zA-Z0-9 ()"]+$/;

interface UseHomepageSearchReturn {
    inputQuery: string;
    setInputQuery: React.Dispatch<React.SetStateAction<string>>;
    searchQuery: string;
    searchItems: boolean;
    isValidQuery: boolean;
    isScrolled: boolean;
    closeSearch: () => void;
}

export const useHomepageSearch = (): UseHomepageSearchReturn => {
    const [inputQuery, setInputQuery] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchItems, setSearchItems] = useState<boolean>(false);
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
        setSearchItems(false);
        setIsValidQuery(true);
    }, []);

    useEffect(() => {
        const trimmed = inputQuery.trim();

        if (!trimmed) {
            setIsValidQuery(true);
            setSearchQuery("");
            return;
        }

        if (VALID_INPUT_QUERY_REGEX.test(trimmed)) {
            setSearchQuery(trimmed);
            setSearchItems(true);
            setIsValidQuery(true);
        } else {
            setSearchItems(false);
            setIsValidQuery(false);
        }
    }, [inputQuery]);

    return {
        inputQuery,
        setInputQuery,
        searchQuery,
        searchItems,
        isValidQuery,
        isScrolled,
        closeSearch,
    };
};
