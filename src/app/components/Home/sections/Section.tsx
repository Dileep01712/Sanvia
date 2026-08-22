interface SectionProps {
    title: string;
    children: React.ReactNode;
}

export default function Section({
    title,
    children,
}: SectionProps) {
    return (
        <section className="w-full pb-14">
            <h2 className="flex items-center pl-2 select-none font-display text-2xl font-bold md:pb-5 md:text-4xl">
                {title}
            </h2>

            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 p-2 md:gap-6 lg:gap-10">
                {children}
            </div>
        </section>
    );
}