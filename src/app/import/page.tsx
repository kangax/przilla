"use client";
import { type Metadata } from "next";
import { ScoreImportWizard } from "./components/ScoreImportWizard";
import PageLayout from "~/app/_components/PageLayout";
import { Tabs } from "@radix-ui/themes";

// Placeholder for PRzilla import wizard (will parameterize ScoreImportWizard later)
function PrzillaImportWizardWrapper() {
  // For now, just render ScoreImportWizard with a prop to indicate PRzilla mode
  return <ScoreImportWizard importType="przilla" />;
}

function SugarWodImportWizardWrapper() {
  return <ScoreImportWizard importType="sugarwod" />;
}

export default function ImportPage() {
  return (
    <PageLayout>
      <div className="container mx-auto p-4">
        <Tabs.Root defaultValue="sugarwod">
          <Tabs.List className="mb-4">
            <Tabs.Trigger value="sugarwod">SugarWOD</Tabs.Trigger>
            <Tabs.Trigger value="przilla">PRzilla</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="sugarwod">
            <SugarWodImportWizardWrapper />
          </Tabs.Content>

          <Tabs.Content value="przilla">
            <PrzillaImportWizardWrapper />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </PageLayout>
  );
}
