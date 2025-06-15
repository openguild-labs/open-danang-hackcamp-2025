import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PortfolioLoading() {
    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-5 w-80" />
            </div>

            {/* Portfolio Overview Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detailed Positions Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Position Overview Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>

                    {/* Loan Details Skeleton */}
                    <Skeleton className="h-40" />
                </CardContent>
            </Card>
        </div>
    );
}
