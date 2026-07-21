"use client";

import { useEffect, useRef, useState } from "react";

export function useDeviceSceneScale(designWidth: number, designHeight: number) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    const widthTarget =
      node.closest(".device-mockup-stage") ??
      node.closest(".device-mockup-sticky__inner") ??
      node.parentElement ??
      node;
    const heightTarget = widthTarget;

    const update = () => {
      const width = widthTarget.clientWidth;
      const height = heightTarget.clientHeight;
      if (width <= 0 || height <= 0) return;
      setScale(
        Math.min(1, width / designWidth, height / designHeight),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(widthTarget);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [designWidth, designHeight]);

  return { shellRef, scale };
}
