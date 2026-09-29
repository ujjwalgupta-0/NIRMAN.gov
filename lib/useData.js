"use client";
import { useCallback, useEffect, useState } from "react";

/** Loads one service call and exposes loading / error / retry to the page. */
export default function useData(fn, deps = []) {
  const [state, setState] = useState({ loading: true });
  const load = useCallback(() => {
    setState({ loading: true });
    fn().then((data) => setState({ data })).catch((e) => setState({ error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(load, [load]);
  return { ...state, retry: load };
}
