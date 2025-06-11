import { CreateLiquidityPoolComponent } from "@/components/liquidity-pool/create-liquidity-pool/create-liquidity-pool"

export default function CreateLiquidityPoolPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <CreateLiquidityPoolComponent />
            </div>
        </div>
    )
}