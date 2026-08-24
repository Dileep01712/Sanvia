import { usePlayerStore } from "@/store/usePlayerStore";

export default function Footer() {
    const isExpanded = usePlayerStore((state) => state.isExpanded);
    const isModalOpen = usePlayerStore((state) => state.isModalOpen);

    return (
        <footer className={`w-full select-none border-t-2 border-zinc-800 bg-zinc-950 px-2 py-6 font-sans text-sm font-normal tracking-wider text-gray-400 md:px-6
            ${isModalOpen && !isExpanded
                ? "pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-[calc(7rem+env(safe-area-inset-bottom))]"
                : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            }
        `}>
            <div className="mb-6 flex justify-center border-b border-zinc-800 pb-6">
                <span className="text-center">
                    © 2025 - {new Date().getFullYear()} Sanvia. All rights reserved.
                </span>
            </div>

            <div className="grid gap-8 md:grid-cols-2 md:gap-0 md:divide-x md:divide-zinc-800">
                <div className="flex flex-col gap-3 leading-relaxed md:pr-10">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        About
                    </span>
                    <p>
                        <strong className="font-semibold text-white">Sanvia</strong> —
                        <em className="text-gray-300"> &quot;A musical path inspired by someone special.&quot;</em>
                    </p>
                    <p>
                        A hidden tribute to <span className="align-sub font-medium text-white">*******</span>.{" "}
                        Softening the name to <strong className="font-medium text-white">San</strong>, and adding{" "}
                        <strong className="font-medium text-white">via</strong> to express a journey of love, sound, and emotion.
                    </p>
                </div>

                <div className="flex flex-col gap-3 leading-relaxed md:pl-10">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Credits
                    </span>
                    <p>
                        Music data is powered by the{" "}
                        <a
                            href="https://backend.listenfree.in/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 transition-colors md:duration-200 hover:text-blue-300 hover:underline"
                        >
                            unofficial JioSaavn API
                        </a>
                        . Backend integration utilizes the{" "}
                        <code className="whitespace-nowrap rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-blue-300">
                            jiosaavn-python
                        </code>{" "}
                        library. Created strictly for educational purposes.
                    </p>

                    <p>
                        Developed by{" "}
                        <a
                            href="https://github.com/Dileep01712"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-white transition-colors md:duration-200 hover:text-blue-400 hover:underline"
                        >
                            Dileep Yadav
                        </a>
                    </p>
                </div>
            </div>

            <div
                aria-hidden="true"
                className="relative mt-6 overflow-hidden select-none"
                style={{ height: "calc(clamp(3.5rem, 22vw, 30rem) * 0.82)" }}
            >
                <span
                    className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap bg-linear-to-b from-zinc-700/70 via-zinc-800/40 to-transparent bg-clip-text font-black leading-none text-transparent"
                    style={{
                        fontSize: "clamp(3.5rem, 22vw, 16rem)",
                        WebkitMaskImage:
                            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
                        maskImage:
                            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
                    }}
                >
                    SANVIA
                </span>
            </div>
        </footer>
    );
}