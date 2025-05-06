import { Box, Container, Flex } from "@radix-ui/themes";
import Header from "~/app/_components/Header";
import { Heading, Text as RadixText } from "@radix-ui/themes"; // Import Heading and Text

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function PageLayout({
  children,
  title,
  description,
}: PageLayoutProps) {
  return (
    <Box
      id="page-layout-container"
      className="min-h-screen bg-background text-foreground"
    >
      <Header />
      <Container size="4" className="pb-8 pt-2">
        <Flex direction="column" gap="6">
          {title && (
            <Heading as="h1" size="7" mb="1">
              {title}
            </Heading>
          )}
          {description && (
            <RadixText as="p" size="4" color="gray" mb="4">
              {description}
            </RadixText>
          )}
          {children}
        </Flex>
      </Container>
    </Box>
  );
}
