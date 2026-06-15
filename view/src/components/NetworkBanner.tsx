"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function NetworkBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-black">
      <WifiOff className="h-4 w-4" />
      You are offline. Reconnecting...
    </div>
  );
}
