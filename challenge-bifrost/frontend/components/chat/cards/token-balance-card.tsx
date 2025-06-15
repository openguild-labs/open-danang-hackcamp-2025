"use client";

import { Coins } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TokenAsset {
  symbol: string;
  balance: string;
  tokenPrice?: string;
}

interface Props {
  title: string;
  balances: TokenAsset[];
  summary?: string;
}

function fmt(n: number, maxFrac = 6): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export default function TokenBalanceCard({ title, balances, summary }: Props) {
  if (!balances?.length) return null;

  const rows = [...balances]
    .map((b) => ({
      ...b,
      bal: Number(b.balance || 0),
      price: Number(b.tokenPrice || 0),
    }))
    .sort((a, b) => b.bal * b.price - a.bal * a.price)
    .slice(0, 10);

  return (
    <Card className="w-full backdrop-blur-sm border bg-muted/40 border-border dark:bg-black/40 dark:border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
          <Coins className="h-5 w-5" /> {title} ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="text-left py-2">Token</th>
                <th className="text-right py-2">Balance</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.symbol}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 text-white font-medium">{t.symbol}</td>
                  <td className="py-3 text-right text-white">{fmt(t.bal)}</td>
                  <td className="py-3 text-right text-white">
                    ${fmt(t.price, 4)}
                  </td>
                  <td className="py-3 text-right text-white font-medium">
                    ${fmt(t.bal * t.price, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {summary && (
          <div
            className="mt-4 text-sm text-white/70 prose prose-invert"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        )}
      </CardContent>
    </Card>
  );
}
