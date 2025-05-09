import React from "react";
import { Box, Button } from "@radix-ui/themes";

interface AuthOverlayProps {
  onSignIn: () => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onSignIn }) => (
  <Box className="absolute inset-0 z-10 flex items-center justify-center rounded-lg">
    <Button size="3" onClick={onSignIn}>
      Sign in to log your score
    </Button>
  </Box>
);

export default AuthOverlay;
