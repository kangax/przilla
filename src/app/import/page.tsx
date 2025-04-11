"use client";

import { ScoreImportWizard } from "./components/ScoreImportWizard";
import PageLayout from "~/app/_components/PageLayout";

export default function ImportPage() {
  return (
    <PageLayout>
      <div className="container mx-auto p-4">
        <ScoreImportWizard />
      </div>
    </PageLayout>
  );
}
