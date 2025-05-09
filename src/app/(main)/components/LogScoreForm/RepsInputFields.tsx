import React from "react";
import { Box, Text, TextField, Flex } from "@radix-ui/themes";

interface RepsInputFieldsProps {
  reps: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export const RepsInputFields: React.FC<RepsInputFieldsProps> = ({
  reps,
  onChange,
  disabled,
}) => (
  <Flex direction="row" gap="2" align="end">
    <Box style={{ flexGrow: 1 }}>
      <Text as="label" htmlFor="reps" size="1" mb="1">
        Reps
      </Text>
      <TextField.Root
        variant="classic"
        id="reps"
        name="reps"
        type="number"
        min={0}
        placeholder="Reps"
        value={reps}
        onChange={onChange}
        disabled={disabled}
        size="3"
        autoComplete="off"
      />
    </Box>
  </Flex>
);

export default RepsInputFields;
