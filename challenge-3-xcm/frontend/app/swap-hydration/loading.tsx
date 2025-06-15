import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 max-w-[768px] mx-auto min-h-screen items-center justify-center">
      <Skeleton className="w-[40px] h-[40px] rounded-md" />
      <Skeleton className="w-full h-[300px] rounded-md" />
    </div>
  );
}