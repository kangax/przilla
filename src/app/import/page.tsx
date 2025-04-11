"use client";

import { ScoreImportWizard } from "./components/ScoreImportWizard";

export default function ImportPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Import Scores</h1>
      <ScoreImportWizard />
    </div>
  );
}
