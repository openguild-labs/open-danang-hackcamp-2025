"use client";
import React from 'react'
import SigpassKit from './sigpasskit'
import Image from 'next/image'
import Link from 'next/link'
import { Separator } from './ui/separator'

const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-6">
                    <Link
                        className="flex items-center gap-2 transition-opacity hover:opacity-80"
                        href="/"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            L
                        </div>
                        <span className="text-xl font-bold">LendFi</span>
                    </Link>
                    
                    <Separator orientation="vertical" className="h-6" />
                    
                    <nav className="hidden md:flex items-center gap-6">
                        <Link 
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" 
                            href="/dashboard"
                        >
                            Dashboard
                        </Link>
                        <Link 
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" 
                            href="/markets"
                        >
                            Markets
                        </Link>
                        <Link 
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" 
                            href="/portfolio"
                        >
                            Portfolio
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <SigpassKit />
                </div>
            </div>
        </header>
    )
}

export default Header