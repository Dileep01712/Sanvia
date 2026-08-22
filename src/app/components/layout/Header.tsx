"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { usePlayerStore } from "@/store/usePlayerStore";

interface HeaderProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    isValidQuery: boolean;
    onSearchSubmit: () => void;
    showBackButton: boolean;
    onBackClick: () => void;
    isScrolled?: boolean;
}

export default function Header({
    inputValue,
    onInputChange,
    isValidQuery,
    onSearchSubmit,
    showBackButton,
    onBackClick,
    isScrolled = false,
}: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const inputId = "search-input";

    const isModalOpen = usePlayerStore((state) => state.isModalOpen);
    const isExpanded = usePlayerStore((state) => state.isExpanded);

    const isBlocked = isModalOpen && isExpanded;

    const handleLogoClick = () => {
        if (pathname === "/") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.push("/");
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBlocked && isValidQuery) {
            onSearchSubmit();
        }
    };

    useEffect(() => {
        const handleShortcut = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLocaleLowerCase() === "m") {
                e.preventDefault();
                if (!isBlocked) {
                    document.getElementById(inputId)?.focus();
                }
            }
        };

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [isBlocked]);

    return (
        <header className={`sticky top-0 z-50 flex justify-between gap-3 px-2 py-3 text-white backdrop-blur md:px-7 lg:px-6 lg:transition-all lg:duration-300
            ${isScrolled
                ? "border-b border-transparent bg-zinc-950/40 shadow-xl shadow-zinc-800/40"
                : "border-b border-zinc-800 bg-zinc-950"
            }
            ${isBlocked ? "pointer-events-none opacity-70" : ""}
        `}>
            {showBackButton ? (
                <Button
                    variant="ghost"
                    onClick={onBackClick}
                    className="group my-auto mr-1.5 flex h-9 md:h-10 select-none items-center gap-2 transition-all md:duration-300 md:mr-0 cursor-pointer hover:text-white hover:bg-transparent"
                >
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        className="h-4 w-4 transform leading-none transition-transform group-hover:-translate-x-1"
                    />
                    <span className="font-sans leading-none">Back</span>
                </Button>
            ) : (
                <Image
                    src="/images/logo.webp"
                    alt="Sanvia Logo"
                    height={40}
                    width={90}
                    onClick={handleLogoClick}
                    priority
                    fetchPriority="high"
                    className="my-auto cursor-pointer select-none rounded-md pr-1 md:pr-0"
                />
            )}

            <form
                onSubmit={handleFormSubmit}
                className={`flex w-72 items-center rounded-xl border border-zinc-600 sm:border-2 sm:transition-all sm:duration-300 sm:focus-within:w-1/2 md:focus-within:w-1/2 lg:focus-within:w-1/3 
                    ${isValidQuery
                        ? "focus-within:border-zinc-200"
                        : "focus-within:border-red-500"
                    }
            `}>
                <Input
                    id={inputId}
                    type="search"
                    placeholder="Search music (Ctrl + M)"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    title="Search music (Ctrl + M)"
                    disabled={isBlocked}
                    autoComplete="off"
                    aria-label="Search query"
                    className="h-9 md:h-10 select-none rounded-l-xl border-none font-display font-medium text-white focus-visible:ring-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />

                <Button
                    type="submit"
                    disabled={isBlocked}
                    className="group h-9 md:h-10 rounded-none rounded-r-xl bg-transparent hover:bg-transparent cursor-pointer"
                >
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="transition-transform md:duration-200 group-hover:scale-125"
                    />
                </Button>
            </form>
        </header>
    );
}