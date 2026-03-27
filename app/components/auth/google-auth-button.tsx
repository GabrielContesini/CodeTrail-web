"use client";

import { LoaderCircle } from "lucide-react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function GoogleAuthButton({
  label = "Continuar com Google",
  loading = false,
  className,
  onClick,
}: {
  label?: string;
  loading?: boolean;
  className?: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      data-testid="google-auth-button"
      onClick={() => void onClick()}
      disabled={loading}
      aria-label={label}
      className={cx(
        "workspace-button workspace-button--secondary touch-target min-h-[52px] w-full justify-center gap-3 rounded-[20px] px-5 text-sm font-medium",
        "border-border/70 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.045]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <GoogleGlyph />
        </span>
      )}
      <span>{loading ? "Abrindo Google..." : label}</span>
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21.805 12.23c0-.69-.062-1.352-.177-1.988H12v3.76h5.5a4.707 4.707 0 0 1-2.042 3.088v2.56h3.303c1.933-1.78 3.044-4.406 3.044-7.42Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.074-.915 6.765-2.35l-3.303-2.56c-.915.614-2.085.977-3.462.977-2.658 0-4.91-1.794-5.715-4.205H2.87v2.642A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.285 13.862A5.996 5.996 0 0 1 5.965 12c0-.646.115-1.27.32-1.862V7.496H2.87A10 10 0 0 0 2 12c0 1.61.385 3.135 1.07 4.504l3.215-2.642Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.933c1.5 0 2.847.516 3.908 1.53l2.93-2.93C17.07 2.89 14.755 2 12 2A10 10 0 0 0 2.87 7.496l3.415 2.642C7.09 7.727 9.342 5.933 12 5.933Z"
        fill="#EA4335"
      />
    </svg>
  );
}
