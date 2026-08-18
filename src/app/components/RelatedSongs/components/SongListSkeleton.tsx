export default function LoadingSkeleton({ count = 15 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <li
                    key={i}
                    className="my-3 flex min-h-17.5 w-80 items-center rounded-xl gap-4 border border-transparent p-2 sm:w-87.5 md:w-92.5 lg:w-105"
                >
                    <div className="h-15 w-15 shrink-0 animate-pulse rounded-md bg-white/10" />

                    <div className="flex w-full flex-col gap-1 md:gap-1.5">
                        <div className="h-5.5 w-3/4 animate-pulse rounded bg-white/10" />
                        <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
                    </div>
                </li>
            ))}
        </>
    );
}