import React from "react";
import { Box, Text, TextField, Flex } from "@radix-ui/themes";

interface TimeInputFieldsProps {
  time_minutes: string;
  time_seconds: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export const TimeInputFields: React.FC<TimeInputFieldsProps> = ({
  time_minutes,
  time_seconds,
  onChange,
  disabled,
}) => (
  <Flex gap="2" align="end">
    <Box style={{ width: "165px" }}>
      <Text as="label" htmlFor="time_minutes" size="1" mb="1">
        Minutes
      </Text>
      <TextField.Root
        variant="classic"
        id="time_minutes"
        name="time_minutes"
        type="number"
        min={0}
        placeholder="min"
        value={time_minutes}
        onChange={onChange}
        disabled={disabled}
        size="3"
        autoComplete="off"
      />
    </Box>
    <Box style={{ width: "165px" }}>
      <Text as="label" htmlFor="time_seconds" size="1" mb="1">
        Seconds
      </Text>
      <TextField.Root
        variant="classic"
        id="time_seconds"
        name="time_seconds"
        type="number"
        min={0}
        max={59}
        placeholder="sec"
        value={time_seconds}
        onChange={onChange}
        disabled={disabled}
        size="3"
        autoComplete="off"
      />
    </Box>
  </Flex>
);

export default TimeInputFields;
