import { Skeleton } from '@/components/ui/skeleton'

/** Loading state shaped like the real agenda, not a bare spinner. */
function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-5 w-2/5" />
      </div>
      <Skeleton className="mt-3 h-4 w-1/3" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

function AgendaSkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <Skeleton className="h-6 w-44" />
        <div className="mt-3 space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-52" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      </section>
    </div>
  )
}

export { MatchCardSkeleton, AgendaSkeleton }
