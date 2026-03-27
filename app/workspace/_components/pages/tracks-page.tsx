"use client";

import { useState } from "react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { DataCard, EmptyState, PageFrame, Pill } from "@/app/workspace/_components/workspace-ui";
import { labelForSkillLevel } from "@/utils/workspace/helpers";
import { SnapshotTile } from "@/app/workspace/_components/pages/shared";

export function TracksPage() {
  const { data } = useWorkspace();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    data!.trackBlueprints[0]?.track.id ?? null,
  );
  const selected =
    data!.trackBlueprints.find((item) => item.track.id === selectedTrackId) ??
    data!.trackBlueprints[0] ??
    null;

  return (
    <PageFrame
      title="Trilhas"
      subtitle="Roadmaps, skills e módulos para orientar sua evolução com o mesmo catálogo do desktop."
    >
      {data!.trackBlueprints.length ? (
        <div className="workspace-split">
          <DataCard title="Catálogo" subtitle="Trilhas disponíveis para o seu workspace.">
            <div className="workspace-stack">
              {data!.trackBlueprints.map((item) => (
                <button
                  key={item.track.id}
                  className={
                    item.track.id === selected?.track.id
                      ? "workspace-list-item workspace-list-item--active"
                      : "workspace-list-item"
                  }
                  onClick={() => setSelectedTrackId(item.track.id)}
                >
                  <div>
                    <strong>{item.track.name}</strong>
                    <span>{item.track.description}</span>
                  </div>
                  <Pill tone="primary">{item.progressPercent.toFixed(0)}%</Pill>
                </button>
              ))}
            </div>
          </DataCard>

          {selected ? (
            <div className="workspace-stack">
              <DataCard title={selected.track.name} subtitle={selected.track.roadmap_summary}>
                <div className="workspace-stack">
                  <Pill tone="primary">Cor {selected.track.color_hex}</Pill>
                  <p className="workspace-copy-muted">
                    {selected.skills.length} skill(s) e {selected.modules.length} módulo(s) ligados a esta trilha.
                  </p>
                </div>
              </DataCard>
              <div className="workspace-split">
                <DataCard title="Skills" subtitle="Progresso por skill.">
                  <div className="workspace-stack">
                    {selected.skills.map((skill) => {
                      const progress =
                        selected.progressBySkill[skill.id]?.progress_percent ?? 0;
                      return (
                        <SnapshotTile
                          key={skill.id}
                          title={skill.name}
                          value={progress}
                          helper={labelForSkillLevel(skill.target_level)}
                        />
                      );
                    })}
                  </div>
                </DataCard>
                <DataCard title="Módulos" subtitle="Blocos de estudo da trilha.">
                  <div className="workspace-stack">
                    {selected.modules.map((module) => (
                      <button key={module.id} className="workspace-list-item" onClick={() => void 0}>
                        <div>
                          <strong>{module.title}</strong>
                          <span>{module.summary}</span>
                        </div>
                        <Pill tone={module.is_core ? "primary" : "neutral"}>
                          {module.estimated_hours}h
                        </Pill>
                      </button>
                    ))}
                  </div>
                </DataCard>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="Sem trilhas disponíveis"
          subtitle="O catálogo do workspace ainda não foi carregado do Supabase."
        />
      )}
    </PageFrame>
  );
}
