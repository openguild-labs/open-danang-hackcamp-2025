"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

export default function EmptyCard({ icon: Icon, title, subtitle }: Props) {
  return (
    <Card className="w-full backdrop-blur-sm border bg-muted/40 border-border dark:bg-black/40 dark:border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-white/40" />
          <p className="text-muted-foreground dark:text-white/60">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
