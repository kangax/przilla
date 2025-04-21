import { type Metadata } from "next";
import { ScoreImportWizard } from "./components/ScoreImportWizard"; // ScoreImportWizard can remain a client component if needed internally
import PageLayout from "~/app/_components/PageLayout";

export const metadata: Metadata = {
  title: "Import Scores from SugarWOD", // Uses template: "Import Scores from SugarWOD | PRzilla"
  description:
    "Easily import your workout history from SugarWOD into PRzilla. Follow our guide to export your CSV and upload it here. Login required to import.",
};

export default function ImportPage() {
  return (
    <PageLayout>
      <div className="container mx-auto p-4">
        <ScoreImportWizard />
      </div>
    </PageLayout>
  );
}
