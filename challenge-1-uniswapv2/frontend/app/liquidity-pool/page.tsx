import React from 'react'
import { LiquidityPoolComponent } from "@/components/liquidity-pool/liquidity-pool"

export default function LiquidityPoolPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <LiquidityPoolComponent />
            </div>
        </div>
    )
}