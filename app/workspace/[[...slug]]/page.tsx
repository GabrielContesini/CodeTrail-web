import { WorkspaceSection } from "@/app/workspace/_components/workspace-section";
import { resolveSection } from "@/utils/workspace/helpers";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const section = resolveSection(slug);
  return <WorkspaceSection section={section} />;
}
