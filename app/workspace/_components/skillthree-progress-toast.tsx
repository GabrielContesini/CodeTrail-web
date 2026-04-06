"use client";

import { Zap } from "lucide-react";
import { formatSkillThreeXp } from "@/utils/skillthree/progression";

export function SkillThreeProgressToast({
  xpDelta,
  levelUpTo,
  unlockedDelta,
}: {
  xpDelta: number;
  levelUpTo: number | null;
  unlockedDelta: number;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-primary/16 bg-[rgba(9,17,24,0.94)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Zap size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Progressão atualizada
          </p>
          <p className="mt-2 text-lg font-black tracking-tight text-white">
            {xpDelta > 0 ? `+${formatSkillThreeXp(xpDelta)} XP` : "Novo progresso registrado"}
          </p>
          <div className="mt-2 space-y-1 text-xs text-text-secondary">
            {levelUpTo ? <p>Nível {levelUpTo} liberado.</p> : null}
            {unlockedDelta > 0 ? (
              <p>
                {unlockedDelta} {unlockedDelta === 1 ? "conquista liberada." : "conquistas liberadas."}
              </p>
            ) : null}
            {!levelUpTo && unlockedDelta === 0 && xpDelta > 0 ? (
              <p>Seu avanço no SkillThree acabou de ser sincronizado.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
