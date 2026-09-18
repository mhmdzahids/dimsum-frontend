import React from 'react';

export default function HomeSkeleton() {
  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-[#F3F4F6] select-none animate-fade-in">
      {/* Header Skeleton - Neutral Gray */}
      <header className="bg-gray-200/90 pt-4 px-6 pb-14 text-left relative z-10 border-b border-gray-300/40">
        <div className="flex items-center justify-between relative">
          {/* Logo Placeholder */}
          <div className="h-10 w-32 rounded-xl bg-gray-300/90 skeleton-shimmer"></div>

          {/* Hamburger Button Placeholder */}
          <div className="w-11 h-11 bg-gray-300/90 rounded-full shrink-0 skeleton-shimmer"></div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gray-300/60 my-4"></div>

        {/* Greeting Area Skeleton */}
        <div className="text-center flex flex-col items-center">
          <div className="h-6 w-52 max-w-[70%] bg-gray-300 rounded-lg skeleton-shimmer mb-2.5"></div>
          <div className="h-3.5 w-72 max-w-[90%] bg-gray-300/70 rounded-md skeleton-shimmer"></div>
        </div>
      </header>

      {/* Sheet Content Skeleton */}
      <div className="bg-white rounded-t-[32px] -mt-6 relative z-20 pt-10 pb-16 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {/* Segmented Control Skeleton */}
        <div className="flex justify-center gap-4 px-6 mb-8">
          {/* Pick Up Button Skeleton */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-[24px] bg-gray-100 border border-gray-200 shadow-xs relative skeleton-shimmer">
            <div className="w-8 h-8 rounded-xl bg-gray-300"></div>
            <div className="w-16 h-3.5 rounded bg-gray-300"></div>
          </div>

          {/* Delivery Button Skeleton */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-[24px] bg-gray-100 border border-gray-200 shadow-xs relative skeleton-shimmer opacity-75">
            <div className="w-8 h-8 rounded-xl bg-gray-250 bg-gray-200"></div>
            <div className="w-16 h-3.5 rounded bg-gray-200"></div>
            <div className="absolute top-3 right-3 w-10 h-4 rounded-full bg-gray-200"></div>
          </div>
        </div>

        {/* Carousel Skeleton */}
        <div className="px-6 pb-6 mt-4">
          <div className="overflow-hidden mb-6 rounded-[20px] shadow-xs relative h-[160px] bg-gray-100 border border-gray-200 skeleton-shimmer flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="w-44 h-4 rounded-md bg-gray-200"></div>
            <div className="w-28 h-3 rounded-md bg-gray-200/80"></div>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-6 h-1.5 rounded-full bg-gray-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
          </div>
        </div>

        {/* Categories / Topping Skeleton */}
        <div className="px-6 mb-8">
          <div className="w-36 h-6 rounded-lg bg-gray-200 skeleton-shimmer mb-6"></div>
          <div className="flex justify-between gap-0.5 overflow-visible pb-4 mt-6 hide-scrollbar">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex flex-col items-center gap-1.5 min-w-[48px] max-w-[54px]">
                <div className="w-[56px] h-[56px] rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shadow-xs skeleton-shimmer">
                  <div className="w-7 h-7 rounded-full bg-gray-200"></div>
                </div>
                <div className="w-10 h-2.5 rounded-full bg-gray-200 skeleton-shimmer mt-1"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Langkah Order Skeleton */}
        <div className="px-6">
          <div className="inline-block bg-gray-200 w-36 h-9 rounded-full skeleton-shimmer mb-8"></div>
          <div className="flex flex-col gap-8">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex gap-6 items-start">
                <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0 mt-1 skeleton-shimmer"></div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="w-44 h-4 rounded-md bg-gray-200 skeleton-shimmer"></div>
                  <div className="w-full h-3 rounded bg-gray-100 skeleton-shimmer"></div>
                  <div className="w-4/5 h-3 rounded bg-gray-100/80 skeleton-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Skeleton - Neutral Gray */}
      <footer className="bg-gray-200/90 pt-12 px-6 pb-12 text-gray-400 flex justify-between items-start min-h-[250px] border-t border-gray-300/40">
        <div className="flex flex-col gap-4">
          <div className="h-10 w-32 rounded-xl bg-gray-300/90 skeleton-shimmer mb-2"></div>
          <div className="flex flex-col gap-2">
            <div className="w-44 h-2.5 rounded bg-gray-300/80 skeleton-shimmer"></div>
            <div className="w-36 h-2.5 rounded bg-gray-300/80 skeleton-shimmer"></div>
            <div className="w-40 h-2.5 rounded bg-gray-300/80 skeleton-shimmer"></div>
            <div className="w-32 h-2.5 rounded bg-gray-300/80 skeleton-shimmer"></div>
            <div className="w-48 h-2.5 rounded bg-gray-300/60 skeleton-shimmer mt-4"></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 items-end">
          <div className="w-24 h-3.5 rounded bg-gray-300 skeleton-shimmer mb-2"></div>
          <div className="flex flex-col gap-2.5 items-end">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-20 h-2.5 rounded bg-gray-300/80 skeleton-shimmer"></div>
                <div className="w-6 h-6 rounded-full bg-gray-300 skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* Floating Action Button Skeleton */}
      <div className="fixed bottom-6 right-5 md:right-[calc(50%-240px+20px)] w-36 h-12 rounded-full bg-gray-300/90 shadow-sm skeleton-shimmer z-[70]"></div>
    </div>
  );
}
