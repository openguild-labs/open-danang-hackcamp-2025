import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Skeleton className="h-4 w-20 mb-2" />
                                        <Skeleton className="h-7 w-16" />
                                    </div>
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />

                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-32" />
                    </div>

                    {/* Pool Cards */}
                    <div className="grid gap-4">
                        {Array(3).fill(0).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center">
                                                <Skeleton className="w-10 h-10 rounded-full" />
                                                <Skeleton className="w-10 h-10 rounded-full -ml-3" />
                                            </div>
                                            <div>
                                                <Skeleton className="h-6 w-20 mb-1" />
                                                <Skeleton className="h-4 w-32" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            {Array(3).fill(0).map((_, j) => (
                                                <div key={j} className="text-center">
                                                    <Skeleton className="h-4 w-16 mb-1" />
                                                    <Skeleton className="h-6 w-20" />
                                                </div>
                                            ))}
                                            <Skeleton className="h-9 w-24" />
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-6">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}