import Link from "next/link";

export default function Navbar() {
    return (
        <div className="flex flex-wrap items-center justify-center w-full gap-2">
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
        </div>
    );
}