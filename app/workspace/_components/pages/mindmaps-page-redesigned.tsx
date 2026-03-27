"use client";

import { usePathname } from "next/navigation";
import { MindMapsEditorPage } from "@/app/workspace/_components/pages/mindmaps-editor-page";
import { MindMapsLibraryPage } from "@/app/workspace/_components/pages/mindmaps-library-page";

export function MindMapsPage() {
  const pathname = usePathname();
  const isEditorRoute = /^\/workspace\/mind-maps\/editor(?:\/|$)/.test(pathname);

  if (isEditorRoute) {
    return <MindMapsEditorPage />;
  }

  return <MindMapsLibraryPage />;
}
