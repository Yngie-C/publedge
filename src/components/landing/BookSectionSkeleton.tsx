export function BookSectionSkeleton() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] animate-pulse rounded-xl bg-gray-200" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
