"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SwapSettings() {
    const [slippage, setSlippage] = useState("0.5")
    const [deadline, setDeadline] = useState("20")

    const presetSlippages = ["0.1", "0.5", "1.0"]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-4 space-y-4">
                <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Slippage Tolerance
                    </Label>
                    <div className="flex items-center gap-2">
                        {presetSlippages.map((preset) => (
                            <Button
                                key={preset}
                                variant={slippage === preset ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSlippage(preset)}
                                className="h-8 px-3 text-xs"
                            >
                                {preset}%
                            </Button>
                        ))}
                        <div className="flex items-center gap-1">
                            <Input
                                type="number"
                                value={slippage}
                                onChange={(e) => setSlippage(e.target.value)}
                                className="h-8 w-16 text-xs text-center"
                                step="0.1"
                                min="0"
                                max="50"
                            />
                            <span className="text-xs text-gray-500">%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Transaction Deadline
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="h-8 w-20 text-xs text-center"
                            min="1"
                        />
                        <span className="text-xs text-gray-500">minutes</span>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
