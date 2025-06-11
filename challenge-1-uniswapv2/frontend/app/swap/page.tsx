import { SwapComponent } from "@/components/swap/swap"

export default function SwapPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Swap Tokens
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Trade tokens in an instant
                    </p>
                </div>

                <div className="flex justify-center">
                    <SwapComponent />
                </div>
            </div>
        </div>
    )
}