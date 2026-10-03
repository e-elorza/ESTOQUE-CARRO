"use client";

import { useEffect, useRef } from "react";

const MESSAGE = "Há alterações não salvas. Sair mesmo assim?";

/**
 * Warns before leaving a form with unsaved edits: closing/reloading the tab (beforeunload)
 * and clicking internal links (client-side navigation doesn't fire beforeunload).
 */
export function useUnsavedChanges<T extends HTMLFormElement>() {
  const ref = useRef<T>(null);
  const dirty = useRef(false);

  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    const markDirty = () => (dirty.current = true);
    const clear = () => (dirty.current = false);
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (
        !dirty.current ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      )
        return;
      const a = (e.target as Element).closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || form.contains(a)) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname)
        return;
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        dirty.current = false;
      }
    };
    form.addEventListener("input", markDirty);
    form.addEventListener("submit", clear);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("submit", clear);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return ref;
}
