import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-5 w-32 mx-auto" />
                </div>

                <div className="flex justify-center">
                    <Card className="w-full max-w-md p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-12" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>

                        {/* From Token Input */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-8" />
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-10 w-24 rounded" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <div className="flex justify-center">
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>

                        {/* To Token Input */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-6" />
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-10 w-24 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Price Info */}
                        <Skeleton className="h-4 w-48 mx-auto" />

                        {/* Swap Button */}
                        <Skeleton className="h-12 w-full rounded" />
                    </Card>
                </div>
            </div>
        </div>
    )
}