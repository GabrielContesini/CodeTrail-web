"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function LandingMotion() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const revealImmediately = () => {
      document
        .querySelectorAll<HTMLElement>(".hero-kicker, .hero-title, .hero-lead, .hero-actions, .hero-surface, .reveal-up, .stagger-item, .cyber-line-x")
        .forEach((element) => {
          element.style.opacity = "1";
          element.style.transform = "none";
          element.style.filter = "none";
        });
    };

    if (reduceMotionQuery.matches) {
      revealImmediately();
      return;
    }

    const handleVisibilityChange = () => {
      gsap.globalTimeline.paused(document.visibilityState !== "visible");
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const context = gsap.context(() => {
      const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTimeline
        .fromTo(".hero-kicker", { opacity: 0, y: 18, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 })
        .fromTo(".hero-title", { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.95 }, "-=0.4")
        .fromTo(".hero-lead", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.45")
        .fromTo(".hero-actions > *", { opacity: 0, y: 14, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.08 }, "-=0.35")
        .fromTo(".hero-surface", { opacity: 0, y: 26, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85 }, "-=0.35");

      gsap.utils.toArray<HTMLElement>(".reveal-up").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 32, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".stagger-grid").forEach((grid) => {
        const items = grid.querySelectorAll(".stagger-item");
        if (!items.length) return;

        gsap.fromTo(
          items,
          { opacity: 0, y: 24, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 84%",
              once: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".cyber-line-x").forEach((line) => {
        gsap.fromTo(
          line,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: {
              trigger: line,
              start: "top 90%",
              once: true,
            },
          },
        );
      });
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.globalTimeline.paused(false);
    };
  }, []);

  return null;
}
