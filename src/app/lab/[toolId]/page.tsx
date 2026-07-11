import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LabToolLayout } from "@/components/lab/lab-tool-layout";
import { getLabToolConfig } from "@/lib/lab/tool-components";
import { getLabTool, labTools } from "@/lib/lab/tools";

type Props = { params: Promise<{ toolId: string }> };

export function generateStaticParams() {
  return labTools.map((tool) => ({ toolId: tool.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = getLabTool(toolId);
  if (!tool) return { title: "Tool tidak ditemukan" };
  return { title: tool.title, description: tool.description };
}

export default async function LabToolPage({ params }: Props) {
  const { toolId } = await params;
  const tool = getLabTool(toolId);
  const config = getLabToolConfig(toolId);

  if (!tool || !config) notFound();

  const ToolComponent = config.component;

  return (
    <LabToolLayout
      icon={tool.icon}
      tag={tool.tag}
      title={tool.title}
      description={tool.description}
      assumptions={config.assumptions}
    >
      <ToolComponent />
    </LabToolLayout>
  );
}
