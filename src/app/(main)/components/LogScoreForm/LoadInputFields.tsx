import React from "react";
import { Box, Text, TextField, Flex } from "@radix-ui/themes";

interface LoadInputFieldsProps {
  load: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export const LoadInputFields: React.FC<LoadInputFieldsProps> = ({
  load,
  onChange,
  disabled,
}) => (
  <Flex direction="row" gap="2" align="end">
    <Box style={{ flexGrow: 1 }}>
      <Text as="label" htmlFor="load" size="1" mb="1">
        Load
      </Text>
      <TextField.Root
        variant="classic"
        id="load"
        name="load"
        type="number"
        min={0}
        placeholder="Load"
        value={load}
        onChange={onChange}
        disabled={disabled}
        size="3"
        autoComplete="off"
      />
    </Box>
  </Flex>
);

export default LoadInputFields;
