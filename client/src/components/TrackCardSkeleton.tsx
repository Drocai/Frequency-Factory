import { Skeleton } from "@/components/ui/skeleton";

export function TrackCardSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      {/* Header with avatar and artist info */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full bg-gray-800" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-800" />
          <Skeleton className="h-3 w-24 bg-gray-800" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full bg-gray-800" />
      </div>

      {/* Track title */}
      <Skeleton className="h-5 w-3/4 bg-gray-800" />

      {/* Waveform placeholder */}
      <Skeleton className="h-16 w-full rounded-lg bg-gray-800" />

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16 rounded bg-gray-800" />
          <Skeleton className="h-8 w-16 rounded bg-gray-800" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg bg-gray-800" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <TrackCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <Skeleton className="w-8 h-8 rounded mx-auto mb-2 bg-gray-800" />
          <Skeleton className="h-6 w-16 mx-auto mb-1 bg-gray-800" />
          <Skeleton className="h-3 w-20 mx-auto bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
          <Skeleton className="w-8 h-8 rounded bg-gray-800" />
          <Skeleton className="w-10 h-10 rounded-full bg-gray-800" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-28 bg-gray-800" />
            <Skeleton className="h-3 w-20 bg-gray-800" />
          </div>
          <Skeleton className="h-6 w-16 bg-gray-800" />
        </div>
      ))}
    </div>
  );
}
