export default function ListenLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-5 w-48 rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-0 overflow-hidden">
        {/* Player area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
          {/* Chapter title */}
          <div className="flex flex-col items-center gap-2 w-full max-w-md">
            <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-6 w-64 rounded bg-gray-200 animate-pulse" />
          </div>

          {/* Player card skeleton */}
          <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-6 flex flex-col gap-5">
            {/* Seek bar */}
            <div className="flex flex-col gap-2">
              <div className="h-2 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex justify-between">
                <div className="h-3 w-8 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-10 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-center gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"
                />
              ))}
              <div className="h-14 w-14 rounded-full bg-gray-200 animate-pulse" />
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-9 w-9 rounded-full bg-gray-200 animate-pulse"
                />
              ))}
            </div>

            {/* Speed + volume row */}
            <div className="flex items-center justify-between">
              <div className="h-7 w-10 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Chapter list skeleton */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-3 w-5 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 flex-1 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-10 rounded bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
