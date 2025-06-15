"use client";

import RequireWallet from "@/components/require-wallet";
import LendingBorrowing from "@/components/lending-borrowing";

export default function LendingBorrowingPage() {
  return (
    <RequireWallet>
      <section className="max-w-5xl mx-auto px-4 py-24 flex flex-col gap-10">
        <header>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-4">
            Lending&nbsp;&&nbsp;Borrowing
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Deposit collateral, borrow tokens and manage your on‑chain positions with a sleek, intuitive interface.
          </p>
        </header>

        <div className="flex justify-center">
          <LendingBorrowing />
        </div>
      </section>
    </RequireWallet>
  );
}