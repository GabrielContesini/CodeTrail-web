"use client";

import { Bolt, CheckSquare, Clock3, FolderKanban, Rocket, Target } from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import { DataCard, MetricCard, PageFrame, Pill, SectionGrid } from "@/app/workspace/_components/workspace-ui";
import { formatHours, formatPercent, labelForSessionType } from "@/utils/workspace/helpers";
import { LockedFeaturePage, MiniChart, PriorityRow, SnapshotTile } from "@/app/workspace/_components/pages/shared";
import type { StudySessionRow } from "@/utils/workspace/types";

export function AnalyticsPage() {
  const { data } = useWorkspace();
  const analytics = data!.analyticsSummary;

  if (!data!.featureAccess.analytics) {
    return <LockedFeaturePage title="Análises premium bloqueadas" feature="Análises" />;
  }

  return (
    <PageFrame
      title="Análises"
      subtitle="Consistência, volume e evolução da trilha em números, usando os mesmos dados do workspace desktop."
    >
      <SectionGrid columns={4}>
        <MetricCard
          label="Horas na semana"
          value={formatHours(analytics.currentWeekHours)}
          helper={`Semana anterior ${formatHours(analytics.previousWeekHours)}`}
          icon={<Clock3 size={16} />}
        />
        <MetricCard
          label="Sessão média"
          value={`${analytics.averageSessionMinutes.toFixed(0)} min`}
          helper="Duração média"
          icon={<Bolt size={16} />}
        />
        <MetricCard
          label="Produtividade"
          value={analytics.averageProductivityScore.toFixed(1)}
          helper="Score médio por sessão"
          icon={<Target size={16} />}
        />
        <MetricCard
          label="Foco prático"
          value={formatPercent(analytics.focusBalancePercent, 0)}
          helper="Prática + projeto + exercícios"
          icon={<Rocket size={16} />}
        />
      </SectionGrid>

      <div className="workspace-split">
        <DataCard title="Horas por dia" subtitle="Distribuição recente do esforço.">
          <MiniChart data={analytics.hoursPerDay} />
        </DataCard>
        <DataCard title="Horas por semana" subtitle="Volume agregado por semana.">
          <MiniChart data={analytics.hoursPerWeek} />
        </DataCard>
      </div>

      <div className="workspace-split">
        <DataCard title="Tipo dominante" subtitle="Leitura rápida do seu padrão atual.">
          <div className="workspace-stack">
            <Pill tone="primary">
              {analytics.dominantStudyType
                ? labelForSessionType(analytics.dominantStudyType)
                : "Sem sessões"}
            </Pill>
            <div className="workspace-stack">
              {Object.entries(analytics.byType).map(([key, value]) => (
                <SnapshotTile
                  key={key}
                  title={labelForSessionType(key as StudySessionRow["type"])}
                  value={value * 10}
                  helper={`${value.toFixed(1)}h`}
                />
              ))}
            </div>
          </div>
        </DataCard>
        <DataCard title="Consolidação" subtitle="KPIs de execução do workspace.">
          <PriorityRow
            icon={<CheckSquare size={16} />}
            title="Taxa de conclusão de tarefas"
            subtitle="Percentual das tarefas fechadas."
            value={formatPercent(analytics.completedTaskRate * 100, 0)}
          />
          <PriorityRow
            icon={<CheckSquare size={16} />}
            title="Revisões concluídas"
            subtitle="Itens já consolidados."
            value={`${analytics.completedReviews}`}
          />
          <PriorityRow
            icon={<FolderKanban size={16} />}
            title="Projetos concluídos"
            subtitle="Portfólio entregue."
            value={`${analytics.completedProjects}`}
          />
          <PriorityRow
            icon={<Target size={16} />}
            title="Dias consistentes"
            subtitle="Sessões registradas nos últimos 30 dias."
            value={`${analytics.consistencyDays}`}
          />
        </DataCard>
      </div>
    </PageFrame>
  );
}
