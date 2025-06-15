import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" />
                    <div>
                        <Skeleton className="h-8 w-56 mb-2" />
                        <Skeleton className="h-5 w-48" />
                    </div>
                </div>

                {/* Main Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Token Pair Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-14 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-14 w-full" />
                            </div>
                        </div>

                        {/* Warning Alert */}
                        <Skeleton className="h-16 w-full" />

                        {/* Liquidity Inputs */}
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-64" />

                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-4 w-16" />
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pool Preview */}
                        <Card className="bg-blue-50 dark:bg-blue-900/20">
                            <CardHeader>
                                <Skeleton className="h-6 w-24" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Create Button */}
                        <Skeleton className="h-12 w-full" />

                        {/* Important Notes */}
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}