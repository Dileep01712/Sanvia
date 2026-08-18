interface SkeletonCardProps {
    isArtist?: boolean;
}

export default function SkeletonCard({ isArtist }: SkeletonCardProps) {
    return (
        <div className="w-full min-w-0 rounded-xl bg-zinc-900 pb-1">

            <div className={`mb-1 w-full aspect-square animate-pulse bg-zinc-700 ${isArtist ? "rounded-full" : "rounded-xl"}`} />

            <div className="mx-auto mb-1 mt-2 h-5 w-3/4 animate-pulse rounded bg-zinc-700" />
            <div className="mx-auto h-5 w-3/4 animate-pulse rounded bg-zinc-700" />
        </div>
    );
}