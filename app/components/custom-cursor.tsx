"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type CursorVariant = "default" | "action" | "native";

const ACTION_SELECTOR = [
  "button",
  "a[href]",
  "[role='button']",
  "input[type='submit']",
  "input[type='button']",
  "summary",
  "label[for]",
  ".cursor-pointer",
].join(", ");

const NATIVE_SELECTOR = [
  "input:not([type='submit']):not([type='button'])",
  "textarea",
  "select",
  "[contenteditable='true']",
  "iframe",
  ".cursor-native",
].join(", ");

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function resolveVariant(target: EventTarget | null): CursorVariant {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) {
    return "default";
  }

  if (element.closest(NATIVE_SELECTOR)) {
    return "native";
  }

  if (element.closest(ACTION_SELECTOR)) {
    return "action";
  }

  return "default";
}

export function CustomCursor() {
  const hydrated = useHydrated();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetPositionRef = useRef({ x: -120, y: -120 });
  const ringPositionRef = useRef({ x: -120, y: -120 });
  const corePositionRef = useRef({ x: -120, y: -120 });
  const variantRef = useRef<CursorVariant>("default");
  const visibleRef = useRef(false);
  const pressedRef = useRef(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const html = document.documentElement;
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncEnabledState() {
      const nextEnabled =
        finePointerQuery.matches &&
        !reducedMotionQuery.matches &&
        html.dataset.cursor !== "native";
      const activeRoot = rootRef.current;

      setEnabled(nextEnabled);
      html.toggleAttribute("data-cursor-overlay", nextEnabled);

      if (!nextEnabled && activeRoot) {
        activeRoot.dataset.visible = "false";
      }
    }

    syncEnabledState();

    finePointerQuery.addEventListener("change", syncEnabledState);
    reducedMotionQuery.addEventListener("change", syncEnabledState);

    return () => {
      finePointerQuery.removeEventListener("change", syncEnabledState);
      reducedMotionQuery.removeEventListener("change", syncEnabledState);
      html.removeAttribute("data-cursor-overlay");
    };
  }, [hydrated]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const root = rootRef.current;
    if (!root) {
      return;
    }
    const rootEl: HTMLDivElement = root;

    function setVisible(nextVisible: boolean) {
      if (visibleRef.current === nextVisible) {
        return;
      }

      visibleRef.current = nextVisible;
      rootEl.dataset.visible = nextVisible ? "true" : "false";
    }

    function setVariant(nextVariant: CursorVariant) {
      if (variantRef.current === nextVariant) {
        return;
      }

      variantRef.current = nextVariant;
      rootEl.dataset.variant = nextVariant;
    }

    function setPressed(nextPressed: boolean) {
      if (pressedRef.current === nextPressed) {
        return;
      }

      pressedRef.current = nextPressed;
      rootEl.dataset.pressed = nextPressed ? "true" : "false";
    }

    function animate() {
      const ringLerp = variantRef.current === "action" ? 0.22 : 0.18;
      const coreLerp = variantRef.current === "action" ? 0.34 : 0.28;

      ringPositionRef.current.x += (targetPositionRef.current.x - ringPositionRef.current.x) * ringLerp;
      ringPositionRef.current.y += (targetPositionRef.current.y - ringPositionRef.current.y) * ringLerp;
      corePositionRef.current.x += (targetPositionRef.current.x - corePositionRef.current.x) * coreLerp;
      corePositionRef.current.y += (targetPositionRef.current.y - corePositionRef.current.y) * coreLerp;

      rootEl.style.setProperty("--cursor-ring-x", `${ringPositionRef.current.x}px`);
      rootEl.style.setProperty("--cursor-ring-y", `${ringPositionRef.current.y}px`);
      rootEl.style.setProperty("--cursor-core-x", `${corePositionRef.current.x}px`);
      rootEl.style.setProperty("--cursor-core-y", `${corePositionRef.current.y}px`);

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    function handlePointerMove(event: PointerEvent) {
      const nextVariant = resolveVariant(event.target);
      targetPositionRef.current = { x: event.clientX, y: event.clientY };

      if (!visibleRef.current) {
        ringPositionRef.current = { x: event.clientX, y: event.clientY };
        corePositionRef.current = { x: event.clientX, y: event.clientY };
        rootEl.style.setProperty("--cursor-ring-x", `${event.clientX}px`);
        rootEl.style.setProperty("--cursor-ring-y", `${event.clientY}px`);
        rootEl.style.setProperty("--cursor-core-x", `${event.clientX}px`);
        rootEl.style.setProperty("--cursor-core-y", `${event.clientY}px`);
      }

      setVariant(nextVariant);
      setVisible(nextVariant !== "native");
    }

    function handlePointerOver(event: PointerEvent) {
      const nextVariant = resolveVariant(event.target);
      setVariant(nextVariant);
      setVisible(nextVariant !== "native");
    }

    function handlePointerDown(event: PointerEvent) {
      setPressed(resolveVariant(event.target) === "action");
    }

    function handlePointerUp() {
      setPressed(false);
    }

    function handleWindowLeave() {
      setVisible(false);
      setPressed(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        setVisible(false);
        setPressed(false);
      }
    }

    function handleWindowMouseOut(event: MouseEvent) {
      if (!(event.relatedTarget instanceof Node)) {
        handleWindowLeave();
      }
    }

    rootEl.dataset.variant = "default";
    rootEl.dataset.visible = "false";
    rootEl.dataset.pressed = "false";

    animationFrameRef.current = window.requestAnimationFrame(animate);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerover", handlePointerOver, true);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("blur", handleWindowLeave);
    window.addEventListener("mouseout", handleWindowMouseOut);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerover", handlePointerOver, true);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("blur", handleWindowLeave);
      window.removeEventListener("mouseout", handleWindowMouseOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="ct-cursor"
      data-variant="default"
      data-visible="false"
      data-pressed="false"
    >
      <span className="ct-cursor__halo" />
      <span className="ct-cursor__ring" />
      <span className="ct-cursor__core" />
      <span className="ct-cursor__glyph">↗</span>
    </div>
  );
}
