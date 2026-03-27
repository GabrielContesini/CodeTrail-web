"use client";

import {
  Bolt,
  BookOpen,
  CheckSquare,
  Clock3,
  FolderKanban,
  LayoutGrid,
  NotepadText,
  Repeat2,
  Target,
} from "lucide-react";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  DataCard,
  MetricCard,
  PageFrame,
  Pill,
  SectionGrid,
} from "@/app/workspace/_components/workspace-ui";
import { ActionLink } from "@/app/components/ui/system-primitives";
import { formatDateTime, formatPercent, labelForSessionType, planCode } from "@/utils/workspace/helpers";
import { PriorityRow, QueuePanel, QuickAction, SnapshotTile } from "@/app/workspace/_components/pages/shared";

export function DashboardPage() {
  const { data } = useWorkspace();
  const summary = data!.dashboardSummary;
  const billing = data!.billing;
  const currentPlan = planCode(billing);
  const urgentReviews = data!.reviews.filter((item) => item.status !== "completed").slice(0, 5);
  const openTasks = data!.tasks.filter((item) => item.status !== "completed").slice(0, 5);
  const activeProjects = data!.projectBundles.filter((item) => item.project.status !== "completed").slice(0, 4);
  const tracks = data!.trackBlueprints.slice(0, 4);

  return (
    <PageFrame
      title="Dashboard"
      subtitle="Uma visão editorial do workspace: foco, fila de execução e progresso prático em uma superfície única."
      actions={
        <>
          <ActionLink href="/workspace/analytics" variant="secondary">
            <LayoutGrid size={16} />
            Análises
          </ActionLink>
          <ActionLink href="/workspace/sessions">
            Nova sessão
          </ActionLink>
        </>
      }
    >
      <div className="workspace-stack">
        <div className="workspace-split workspace-split--hero">
          <DataCard
            title="Comando do dia"
            subtitle="A versão web replica o backend do desktop e mantém o foco em intenção, execução e retenção."
            accent="primary"
          >
            <div className="workspace-stack">
              <Pill tone="primary">
                {summary.totalSessions === 0 ? "Primeiro ciclo" : "Histórico ativo"}
              </Pill>
              <h3 className="workspace-hero-title">
                {summary.totalSessions === 0
                  ? "Comece registrando sua primeira sessão de foco."
                  : "Você já gerou histórico. Agora use esse histórico para priorizar."}
              </h3>
              <p className="workspace-copy-muted">
                Próxima sessão registrada:{" "}
                {summary.nextSession
                  ? `${labelForSessionType(summary.nextSession.type)} • ${formatDateTime(summary.nextSession.start_time)}`
                  : "nenhuma sessão iniciada ainda."}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <QuickAction
                  icon={<BookOpen size={16} />}
                  title="Iniciar foco"
                  subtitle="Abrir cronômetro e contexto da sessão."
                  href="/workspace/sessions"
                  className="h-full"
                />
                <QuickAction
                  icon={<CheckSquare size={16} />}
                  title="Nova tarefa"
                  subtitle="Converter intenção em próximo passo."
                  href="/workspace/tasks"
                  className="h-full"
                />
                <QuickAction
                  icon={<NotepadText size={16} />}
                  title="Abrir notas"
                  subtitle="Registrar resumo, snippet ou bloqueio."
                  href="/workspace/notes"
                  className="h-full"
                />
              </div>
            </div>
          </DataCard>

          <DataCard
            title="Radar de atenção"
            subtitle="Leitura rápida do que merece ação imediata antes de mudar de área."
          >
            <PriorityRow
              icon={<CheckSquare size={16} />}
              title="Pendências de tarefa"
              subtitle="Próximos passos ainda abertos."
              value={`${summary.pendingTasks}`}
            />
            <PriorityRow
              icon={<Repeat2 size={16} />}
              title="Revisões urgentes"
              subtitle="Retenção em risco neste momento."
              value={`${summary.overdueReviews}`}
            />
            <PriorityRow
              icon={<FolderKanban size={16} />}
              title="Projetos ativos"
              subtitle="Entregas práticas em andamento."
              value={`${summary.activeProjects}`}
            />
          </DataCard>
        </div>

        <DataCard
          title="Plano e sincronização"
          subtitle="A web usa as mesmas conexões do Windows: Supabase, billing por Stripe e dados por usuário."
        >
          <div className="workspace-inline-banner">
            <div>
              <strong>Plano atual: {currentPlan.toUpperCase()}</strong>
              <p>
                {billing.subscription?.is_trialing
                  ? `Trial ativo até ${formatDateTime(billing.subscription.trial_ends_at)}`
                  : billing.subscription?.current_period_end
                    ? `Próximo ciclo até ${formatDateTime(billing.subscription.current_period_end)}`
                    : "Sem período premium ativo no momento."}
              </p>
            </div>
            <div className="workspace-inline-actions">
              <ActionLink href="/workspace/settings/billing" variant="secondary">
                Gerenciar plano
              </ActionLink>
              <Pill tone={currentPlan === "free" ? "warning" : "success"}>
                Backend sincronizado
              </Pill>
            </div>
          </div>
        </DataCard>

        <SectionGrid columns={4}>
          <MetricCard
            label="Horas na semana"
            value={summary.hoursThisWeek.toFixed(1)}
            helper="Volume consolidado recente"
            icon={<Clock3 size={16} />}
          />
          <MetricCard
            label="Streak"
            value={`${summary.streakDays} dias`}
            helper="Sequência ativa de consistência"
            icon={<Bolt size={16} />}
          />
          <MetricCard
            label="Revisões urgentes"
            value={`${summary.overdueReviews}`}
            helper="Itens vencidos pedindo retenção"
            icon={<Repeat2 size={16} />}
          />
          <MetricCard
            label="Progresso médio"
            value={formatPercent(summary.trackProgress, 0)}
            helper="Média entre trilhas ativas"
            icon={<Target size={16} />}
          />
        </SectionGrid>

        <div className="workspace-split">
          <DataCard title="Fila de execução" subtitle="Itens que exigem ação imediata.">
            <div className="workspace-stack">
              <QueuePanel
                title="Tarefas do dia"
                emptyLabel="Sem tarefas pendentes. Abra Tarefas para definir o próximo passo."
                items={openTasks.map((item) => ({
                  title: item.title,
                  subtitle: item.priority,
                }))}
              />
              <QueuePanel
                title="Revisões pendentes"
                emptyLabel="Nenhuma revisão pendente agora."
                items={urgentReviews.map((item) => ({
                  title: item.title,
                  subtitle: `${item.interval_label} • ${item.status}`,
                }))}
              />
            </div>
          </DataCard>

          <div className="workspace-stack">
            <DataCard title="Pulso das trilhas" subtitle="Roadmaps e skills em movimento.">
              <div className="workspace-stack">
                {tracks.map((item) => (
                  <SnapshotTile
                    key={item.track.id}
                    title={item.track.name}
                    value={item.progressPercent}
                  />
                ))}
              </div>
            </DataCard>
            <DataCard title="Projetos em andamento" subtitle="Portfólio prático com etapas e entregáveis.">
              <div className="workspace-stack">
                {activeProjects.map((bundle) => (
                  <SnapshotTile
                    key={bundle.project.id}
                    title={bundle.project.title}
                    value={bundle.project.progress_percent}
                  />
                ))}
              </div>
            </DataCard>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
