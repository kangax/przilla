import React from "react";
import { Text, Flex, Separator } from "@radix-ui/themes";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export const DifficultyHeaderTooltipContent = () => {
  return (
    <TooltipPrimitive.Content
      className="min-w-[510px] max-w-[510px] rounded-sm border bg-white p-4 text-black shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      sideOffset={5}
    >
      <div>
        <Flex direction="column" gap="2">
          <Text
            size="2"
            weight="bold"
            className="text-black dark:text-gray-100"
          >
            Difficulty Levels
          </Text>
          <Separator my="1" size="4" />
          <Flex align="start" gap="2">
            <Text
              size="1"
              color="green"
              weight="bold"
              style={{ minWidth: 100 }}
            >
              Easy
            </Text>
            <Text size="1" className="text-black dark:text-gray-100">
              Bodyweight only, low volume, no complex skills
              <br />
              <Text
                size="1"
                className="italic text-black dark:text-gray-100"
              >
                (e.g. "500m row")
              </Text>
            </Text>
          </Flex>
          <Flex align="start" gap="2">
            <Text
              size="1"
              color="yellow"
              weight="bold"
              style={{ minWidth: 100 }}
            >
              Medium
            </Text>
            <Text size="1" className="text-black dark:text-gray-100">
              Moderate volume, light-moderate loads, basic skills
              <br />
              <Text
                size="1"
                className="italic text-black dark:text-gray-100"
              >
                (e.g. "Angie")
              </Text>
            </Text>
          </Flex>
          <Flex align="start" gap="2">
            <Text
              size="1"
              color="orange"
              weight="bold"
              style={{ minWidth: 100 }}
            >
              Hard
            </Text>
            <Text size="1" className="text-black dark:text-gray-100">
              High volume OR moderate skill/heavy load
              <br />
              <Text
                size="1"
                className="italic text-black dark:text-gray-100"
              >
                (e.g. "Isabel")
              </Text>
            </Text>
          </Flex>
          <Flex align="start" gap="2">
            <Text
              size="1"
              color="red"
              weight="bold"
              style={{ minWidth: 100 }}
            >
              Very Hard
            </Text>
            <Text size="1" className="text-black dark:text-gray-100">
              Heavy loads + high skill + high volume
              <br />
              <Text
                size="1"
                className="italic text-black dark:text-gray-100"
              >
                (e.g. "Eva")
              </Text>
            </Text>
          </Flex>
          <Flex align="start" gap="2">
            <Text
              size="1"
              color="purple"
              weight="bold"
              style={{ minWidth: 100 }}
            >
              Extremely Hard
            </Text>
            <Text size="1" className="text-black dark:text-gray-100">
              Maximal loads, multiple high-skill elements, or extreme
              volume
              <br />
              <Text
                size="1"
                className="italic text-black dark:text-gray-100"
              >
                (e.g. "Awful Annie")
              </Text>
            </Text>
          </Flex>
        </Flex>
      </div>
    </TooltipPrimitive.Content>
  );
};
