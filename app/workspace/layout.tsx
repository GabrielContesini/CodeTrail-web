import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { WorkspaceProvider } from "@/app/workspace/_components/workspace-provider";
import { WorkspaceShell } from "@/app/workspace/_components/workspace-shell";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <WorkspaceProvider
      initialUser={{
        id: user.id,
        email: user.email || "",
        fullName: (user.user_metadata.full_name as string | undefined) || "",
      }}
    >
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
