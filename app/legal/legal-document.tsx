import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buildMailtoHref, legalConfig } from "@/utils/legal-config";

const brandMark = "/design/CodeTrailMainIcon.png";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalDocumentProps {
  active: "terms" | "privacy";
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}

const documentLinks = [
  { id: "terms" as const, href: "/termos-de-uso", label: "Termos de Uso" },
  { id: "privacy" as const, href: "/politica-de-privacidade", label: "Política de Privacidade" },
];

export function LegalDocument({
  active,
  title,
  description,
  updatedAt,
  sections,
}: LegalDocumentProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-ui text-on-surface selection:bg-primary/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(50,208,255,0.13),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(159,232,112,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60 [mask-image:radial-gradient(circle_at_center,black_42%,transparent_88%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="glass-panel overflow-hidden rounded-[30px] border border-border/70 px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-4">
              <Link
                href="/"
                className="inline-flex w-fit items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:border-primary/40 hover:bg-primary/14"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10">
                  <Image
                    src={brandMark}
                    alt="CodeTrail"
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                Voltar para o app
              </Link>

              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center rounded-full border border-border/70 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                  Base legal do ecossistema web
                </span>
                <h1 className="m-0 text-3xl font-display font-medium tracking-tight text-white sm:text-4xl">
                  {title}
                </h1>
                <p className="m-0 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="glass-panel flex flex-col gap-3 rounded-[24px] border border-border/70 bg-white/[0.03] p-4 sm:min-w-[280px]">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Atualizado em {updatedAt}
              </span>
              <p className="m-0 text-sm leading-relaxed text-text-secondary">
                Controlador: {legalConfig.controllerName}
              </p>
              {legalConfig.controllerDocument ? (
                <p className="m-0 text-xs leading-relaxed text-text-secondary">
                  {legalConfig.controllerDocument}
                </p>
              ) : null}
              {legalConfig.controllerAddress ? (
                <p className="m-0 text-xs leading-relaxed text-text-secondary">
                  {legalConfig.controllerAddress}
                </p>
              ) : null}
              <a
                href={buildMailtoHref(
                  "CodeTrail - Privacidade e direitos do titular",
                  legalConfig.privacyEmail,
                )}
                className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-white"
              >
                Privacidade: {legalConfig.privacyEmail}
              </a>
              <p className="m-0 text-xs leading-relaxed text-text-secondary">
                {legalConfig.dpoName}: {legalConfig.dpoEmail}
              </p>
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-3 border-t border-border/70 pt-6">
            {documentLinks.map((item) => {
              const isActive = item.id === active;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    isActive
                      ? "border-primary/40 bg-primary/12 text-primary"
                      : "border-border/70 bg-white/[0.02] text-text-secondary hover:border-primary/24 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <section className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <aside className="glass-panel rounded-[28px] border border-border/70 px-5 py-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Sumário</span>
            <div className="mt-4 flex flex-col gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-2xl border border-transparent px-3 py-2 text-sm leading-relaxed text-text-secondary transition-colors hover:border-primary/20 hover:bg-white/[0.03] hover:text-white"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </aside>

          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="glass-panel rounded-[28px] border border-border/70 px-6 py-6 sm:px-7"
              >
                <h2 className="m-0 text-xl font-display font-medium tracking-tight text-white">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-text-secondary">{section.content}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
