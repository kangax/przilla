import { Box, Container, Flex } from "@radix-ui/themes";
import Header from "~/app/_components/Header";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box className="min-h-screen bg-background text-foreground">
      <Header />
      <Container size="4" className="pb-8 pt-2">
        <Flex direction="column" gap="6">
          {children}
        </Flex>
      </Container>
    </Box>
  );
}
