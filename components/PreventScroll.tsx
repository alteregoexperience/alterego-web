"use client";

import { useEffect } from "react";

export default function PreventScroll() {
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  return null;
}
