"use client";

import { Zap, X, CheckCircle2 } from "lucide-react";
import { formatSkillThreeXp } from "@/utils/skillthree/progression";

export function SkillThreeProgressToast({
  xpDelta,
  levelUpTo,
  unlockedDelta,
  currentXp,
  nextLevelXp,
}: {
  xpDelta: number;
  levelUpTo: number | null;
  unlockedDelta: number;
  currentXp: number;
  nextLevelXp: number | null;
}) {
  const progressPercent = nextLevelXp ? Math.min(100, (currentXp / nextLevelXp) * 100) : 100;
  // Calculate current tier (level) and next tier
  const calculatedLevel = Math.max(1, Math.floor(currentXp / 320) + 1);
  const currentTierLabel = `LEVEL ${calculatedLevel}`;
  const nextTierLabel = nextLevelXp ? `LEVEL ${calculatedLevel + 1}` : 'MAX LEVEL';
  
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-primary/20 bg-[#0a0f14] p-5 shadow-[0_0_20px_rgba(0,255,255,0.06)] backdrop-blur-xl w-full max-w-[420px]">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#1b3d4f] to-[#112431] border border-[#2a4e60]">
            <Zap size={22} className="fill-white text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                +{formatSkillThreeXp(xpDelta)} XP
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                MASTERY
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-primary">
              <CheckCircle2 size={12} className="fill-primary text-[#0a0f14]" />
              <span className="font-bold tracking-widest uppercase text-[10px]">
                {levelUpTo ? `SYSTEM_UPGRADE: LEVEL_${levelUpTo}_MASTERED` : unlockedDelta > 0 ? "SYSTEM_UPGRADE: ACHIEVEMENT_UNLOCKED" : "SYSTEM_UPGRADE: KATANA_MASTERED"}
              </span>
            </div>
          </div>
        </div>
        {/* We won't make X interactive here because the parent workspace-shell unmounts it on timer, but styling it provides familiarity */}
        <button className="text-gray-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Terminal Block */}
      <div className="mt-5 rounded-md bg-[#05080a] border border-white/5 p-3 text-[10px] font-mono leading-relaxed text-gray-400">
        <p><span className="text-primary">{`>`}</span> EXECUTING REWARD_DISPATCH... SUCCESS</p>
        {unlockedDelta > 0 && <p><span className="text-primary">{`>`}</span> BONUS_APPLIED: "ACHIEVEMENT" (+BONUS XP)</p>}
        {levelUpTo && <p><span className="text-primary">{`>`}</span> OVERRIDE: TIER_PROMOTION_GRANTED</p>}
        {!unlockedDelta && !levelUpTo && <p><span className="text-primary">{`>`}</span> BONUS_APPLIED: "FIRST_BLOOD" (+{formatSkillThreeXp(xpDelta)} XP)</p>}
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div className="flex items-end justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
            PROGRESS TO {nextTierLabel}
          </span>
          <span className="text-[10px] font-bold text-primary drop-shadow-[0_0_4px_rgba(0,255,255,0.4)]">
            {formatSkillThreeXp(currentXp)} / {nextLevelXp ? formatSkillThreeXp(nextLevelXp) : 'MAX'} XP
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-[9px] uppercase tracking-wider text-gray-500 flex justify-between">
          <span>CURRENT TIER: {currentTierLabel}</span>
          <span>NEXT TIER: {nextTierLabel}</span>
        </div>
      </div>

      <div className="mt-5 flex justify-center border-t border-white/5 pt-4">
        <span className="text-[9px] font-bold tracking-widest uppercase text-gray-500">
          PRESS <span className="rounded bg-white/10 mx-1 px-1.5 py-0.5 text-gray-300">TAB</span> TO VIEW DETAILED BREAKDOWN
        </span>
      </div>
    </div>
  );
}
