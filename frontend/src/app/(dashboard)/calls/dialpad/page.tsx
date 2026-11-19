"use client";

import { Suspense } from "react";
import DialPad from "./_components/DialPad";
import { Skeleton } from "@/components/ui/skeleton";

export default function DialPadPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-5 h-[560px] rounded-2xl" />
            <Skeleton className="lg:col-span-7 h-[560px] rounded-2xl" />
          </div>
        </div>
      }
    >
      <DialPad />
    </Suspense>
  );
}
