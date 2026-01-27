import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Column Header */}
      <div className="rounded-lg border-t-4 border-t-muted bg-muted/30 p-3 mb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-6 rounded-full" />
        </div>
        <Skeleton className="h-3 w-20 mt-1" />
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 min-h-[200px] p-1">
        {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-6 rounded" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-1.5 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Button */}
      <Skeleton className="h-9 w-full rounded-md mt-2" />
    </div>
  );
}

export function CRMKanbanSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pipeline KPI + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-40 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-10 w-[200px] rounded-md" />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <KanbanColumnSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
