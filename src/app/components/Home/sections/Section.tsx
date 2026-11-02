interface SectionProps {
    title: string;
    children: React.ReactNode;
}

export default function Section({ title, children }: SectionProps) {
    return (
        <section className="w-full pb-20">
            <h2 className="flex select-none items-center pl-2 font-display text-2xl font-bold md:pb-5 md:text-4xl">
                {title}
            </h2>

            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 p-2 md:gap-5 lg:gap-6">
                {children}
            </div>
        </section>
    );
}