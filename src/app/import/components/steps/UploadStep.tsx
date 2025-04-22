"use client";

import React from "react";
import { Box, Card, Text, Link, Heading, Flex } from "@radix-ui/themes";
import Image from "next/image";
import { CsvUploadZone } from "../CsvUploadZone";
import { LoadingIndicator } from "../../../_components/LoadingIndicator";

interface UploadStepProps {
  importType: "przilla" | "sugarwod";
  isLoadingWods: boolean;
  wodsError: Error | null | unknown;
  handleFileAccepted: (file: File) => void;
}

export function UploadStep({
  importType,
  isLoadingWods,
  wodsError,
  handleFileAccepted,
}: UploadStepProps) {
  // Render Loading state while WODs are fetching initially
  if (isLoadingWods) {
    return <LoadingIndicator message="Loading WOD data..." />;
  }

  // Render Error state if WOD fetching failed
  if (wodsError) {
    const errorMessage =
      wodsError instanceof Error
        ? wodsError.message
        : "Unknown error fetching WODs";

    return (
      <div className="rounded border border-red-300 p-4 text-red-600">
        Error loading WOD data: {errorMessage}
      </div>
    );
  }

  return (
    <Flex direction={{ initial: "column", md: "row" }} gap="6">
      {/* Instructions Section (Left Column) */}
      <Box className="w-full md:w-1/2 md:flex-shrink-0">
        <Card variant="surface">
          <Box p="3">
            {importType === "przilla" ? (
              <>
                <Text as="p" size="2" color="gray" mb="4">
                  To import your scores from PRzilla:
                </Text>
                <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm">
                  <li>
                    <Text size="2">
                      Go to your profile dropdown and select{" "}
                      <strong>Export as CSV</strong>.
                    </Text>
                  </li>
                  <li>
                    <Text size="2">
                      Download the CSV file to your computer.
                    </Text>
                  </li>
                  <li>
                    <Text size="2">
                      Upload that CSV file here (on the right).
                    </Text>
                  </li>
                </ol>
              </>
            ) : (
              <>
                <Text as="p" size="2" color="gray" mb="4">
                  Follow these steps to get your workout data CSV file from
                  SugarWOD:
                </Text>
                <ol className="mb-4 ml-5 list-decimal space-y-2 text-sm">
                  <li>
                    <Text size="2">
                      Go to your{" "}
                      <Link
                        href="https://app.sugarwod.com/athletes/me#profile"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        SugarWOD profile page
                      </Link>
                    </Text>
                  </li>
                  <li>
                    <Text size="2">
                      Click on the <strong>Export Workouts</strong> button (as
                      shown below).
                    </Text>
                  </li>
                  <li>
                    <Text size="2">
                      Wait for SugarWOD to send CSV file with all your workouts.
                    </Text>
                  </li>
                  <li>
                    <Text size="2">
                      Upload that CSV file here (on the right).
                    </Text>
                  </li>
                </ol>
                <Box className="relative mt-4 h-auto w-full max-w-xl overflow-hidden rounded border">
                  <Image
                    src="/images/sugarwod_export_3.png"
                    alt="Screenshot showing the 'Export Workouts' button in SugarWOD profile settings"
                    width={600}
                    height={300}
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </Box>
              </>
            )}
          </Box>
        </Card>
      </Box>

      {/* Upload Zone (Right Column) */}
      <Box className="flex-grow">
        <CsvUploadZone
          onFileAccepted={handleFileAccepted}
          acceptedTypes={["text/csv"]}
        />
      </Box>
    </Flex>
  );
}
