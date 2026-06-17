import { PostGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container-prose py-10">
      <div className="h-[420px] w-full rounded-3xl bg-slate-200 dark:bg-slate-700/60 animate-pulse mb-10" />
      <PostGridSkeleton count={6} />
    </div>
  );
}
