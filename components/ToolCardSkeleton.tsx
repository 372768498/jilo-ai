import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ToolCardSkeleton() {
  return (
    <Card className="transition-all">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-4 w-40 rounded mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-full rounded" />
      </CardContent>
    </Card>
  )
}
