"use client";

import dynamic from "next/dynamic";

function Shell() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="h-[108px] shrink-0 border-b border-line bg-surface" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[520px] shrink-0 space-y-3 p-5 md:block">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-[160px] rounded-xl" />
          ))}
        </div>
        <div className="flex-1 bg-surface-2" />
      </div>
    </div>
  );
}

const App = dynamic(() => import("./app"), { ssr: false, loading: Shell });

export function ClientRoot() {
  return <App />;
}
