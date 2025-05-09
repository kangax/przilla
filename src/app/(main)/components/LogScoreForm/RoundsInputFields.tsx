import React from "react";
import { Box, Text, TextField, Flex } from "@radix-ui/themes";

interface RoundsInputFieldsProps {
  rounds_completed: string;
  partial_reps: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export const RoundsInputFields: React.FC<RoundsInputFieldsProps> = ({
  rounds_completed,
  partial_reps,
  onChange,
  disabled,
}) => (
  <Flex direction="row" gap="2" align="end">
    <Box style={{ flexGrow: 1 }}>
      <Text as="label" htmlFor="rounds_completed" size="1" mb="1">
        Rounds
      </Text>
      <TextField.Root
        variant="classic"
        id="rounds_completed"
        name="rounds_completed"
        type="number"
        min={0}
        placeholder="Rounds"
        value={rounds_completed}
        onChange={onChange}
        disabled={disabled}
        size="3"
        autoComplete="off"
      />
    </Box>
    <Box style={{ flexGrow: 1 }}>
      <Text as="label" htmlFor="partial_reps" size="1" mb="1">
        Partial Reps
      </Text>
      <TextField.Root
        variant="classic"
        id="partial_reps"
        name="partial_reps"
        type="number"
        min={0}
        placeholder="Partial Reps"
        value={partial_reps}
        onChange={onChange}
        disabled={disabled}
        size="3"
        autoComplete="off"
      />
    </Box>
  </Flex>
);

export default RoundsInputFields;
