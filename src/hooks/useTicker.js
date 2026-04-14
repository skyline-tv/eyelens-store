import { useState, useEffect } from "react";

export function useTicker(start, end, duration = 1200) {
  const [val, setVal] = useState(start);
  useEffect(() => {
    let st = null;
    let startTime = null;
    const step = (t) => {
      if (!startTime) startTime = t;
      const prog = Math.min((t - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setVal(Math.floor(start + (end - start) * ease));
      if (prog < 1) st = requestAnimationFrame(step);
    };
    st = requestAnimationFrame(step);
    return () => cancelAnimationFrame(st);
  }, [start, end, duration]);
  return val;
}
