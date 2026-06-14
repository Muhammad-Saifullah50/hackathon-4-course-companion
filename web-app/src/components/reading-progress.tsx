"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function update() {
      const total = document.documentElement.scrollHeight - innerHeight;
      setProgress(total > 0 ? Math.min(100, Math.round((scrollY / total) * 100)) : 0);
    }
    update();
    addEventListener("scroll", update, { passive: true });
    return () => removeEventListener("scroll", update);
  }, []);
  return (
    <div className="reading-progress" aria-hidden="true">
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}
