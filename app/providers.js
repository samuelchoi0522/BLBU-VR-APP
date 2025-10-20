"use client";

import { SessionProvider } from "next-auth/react";
import { VideoProvider } from "@/context/VideoContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <VideoProvider>{children}</VideoProvider>
    </SessionProvider>
  );
}
