"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Icon,
//   Divider,
//   useColorModeValue,
  Tabs,
//   TabList,
//   TabPanels,
//   Tab,
//   TabPanel,
  Stack,
} from "@chakra-ui/react";
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiPackage,
  FiActivity,
  FiPlus,
  FiTruck,
} from "react-icons/fi";

export default function Warehouse() {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <SidebarWithHeader username="kevin">
      <Flex direction="column" gap={6} p={4}>
        <Heading size="lg">Warehouse</Heading>

        {/* Top Summary */}
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap={4}
        >
          <GridItem>
            <Box
              borderWidth="1px"
              borderColor={cardBorder}
              rounded="lg"
              bg={cardBg}
              p={4}
            >
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontSize="sm" color="gray.500">
                    Total SKUs
                  </Text>
                  <Heading size="md">128</Heading>
                </VStack>
                <Icon as={FiPackage} boxSize={6} />
              </HStack>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              borderWidth="1px"
              borderColor={cardBorder}
              rounded="lg"
              bg={cardBg}
              p={4}
            >
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontSize="sm" color="gray.500">
                    On‑Hand Stock
                  </Text>
                  <Heading size="md">4,912 pcs</Heading>
                </VStack>
                <Icon as={FiTruck} boxSize={6} />
              </HStack>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              borderWidth="1px"
              borderColor={cardBorder}
              rounded="lg"
              bg={cardBg}
              p={4}
            >
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontSize="sm" color="gray.500">
                    Pending Movements
                  </Text>
                  <Heading size="md">7</Heading>
                </VStack>
                <Icon as={FiActivity} boxSize={6} />
              </HStack>
            </Box>
          </GridItem>
        </Grid>

        {/* Movements & Activity */}
        <Grid
          templateColumns={{ base: "1fr", xl: "2fr 1fr" }}
          gap={6}
        >
          {/* Stock Movements */}
          <GridItem>
            <Box
              borderWidth="1px"
              borderColor={cardBorder}
              rounded="lg"
              bg={cardBg}
              p={4}
            >
              <HStack justify="space-between" mb={2}>
                <Heading size="md">Stock Movements</Heading>
                <HStack>
                  <Button
                    size="sm"
                    // leftIcon={<FiArrowDownCircle />}
                    variant="outline"
                    bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}
                  >
                    Stock In
                  </Button>
                  <Button
                    size="sm"
                    // leftIcon={<FiArrowUpCircle />}
                    variant="outline"
                    bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}
                  >
                    Stock Out
                  </Button>
                  <Button
                    size="sm"
                    // leftIcon={<FiPlus />}
                    variant="outline"
                    bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}
                  >
                    Sample Out
                  </Button>
                </HStack>
              </HStack>

              {/* <Divider my={3} /> */}

              <Tabs.Root size="sm" colorScheme="blue" defaultValue="inbound">
                <Tabs.List>
                  <Tabs.Trigger value="inbound">Inbound</Tabs.Trigger>
                  <Tabs.Trigger value="outbound">Outbound</Tabs.Trigger>
                  <Tabs.Trigger value="sample">Sample</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="inbound">
                    <Stack gap={3}>
                      <MovementRow
                        type="in"
                        code="GRN-24015"
                        desc="Arrival — Container #A781"
                        qty="+ 1,200 pcs"
                        time="Today • 10:24"
                      />
                      <MovementRow
                        type="in"
                        code="GRN-24014"
                        desc="Inbound — PO 88219"
                        qty="+ 540 pcs"
                        time="Yesterday • 16:02"
                      />
                    </Stack>
                </Tabs.Content>

                <Tabs.Content value="outbound">
                    <Stack gap={3}>
                      <MovementRow
                        type="out"
                        code="DLV-33910"
                        desc="Outbound to Customer — SO 4411"
                        qty="- 300 pcs"
                        time="Today • 09:10"
                      />
                    </Stack>
                </Tabs.Content>

                <Tabs.Content value="sample">
                    <Stack gap={3}>
                      <MovementRow
                        type="sample"
                        code="SMP-88412"
                        desc="Product Sample Request"
                        qty="- 12 pcs"
                        time="2 days ago"
                      />
                    </Stack>
                </Tabs.Content>
              </Tabs.Root>
            </Box>
          </GridItem>

          {/* Recent Activity */}
          <GridItem>
            <Box
              borderWidth="1px"
              borderColor={cardBorder}
              rounded="lg"
              bg={cardBg}
              p={4}
            >
              <Heading size="md" mb={2}>
                Recent Warehouse Activity
              </Heading>
              {/* <Divider mb={3} /> */}
              <Stack gap={3}>
                <ActivityItem
                  label="Stock checked & reconciled"
                  meta="By Kevin • 10:02"
                />
                <ActivityItem
                  label="Cycle count — Aisle B3"
                  meta="Yesterday • 17:44"
                />
                <ActivityItem
                  label="Sample dispatch created"
                  meta="2 days ago"
                />
              </Stack>
            </Box>
          </GridItem>
        </Grid>
      </Flex>
    </SidebarWithHeader>
  );
}

/* Helper components */

function MovementRow({
  type,
  code,
  desc,
  qty,
  time,
}: {
  type: "in" | "out" | "sample";
  code: string;
  desc: string;
  qty: string;
  time: string;
}) {
  const color =
    type === "in" ? "green" : type === "out" ? "red" : "purple";
  const icon =
    type === "in"
      ? FiArrowDownCircle
      : type === "out"
      ? FiArrowUpCircle
      : FiPlus;

  return (
    <HStack
      justify="space-between"
      borderWidth="1px"
      rounded="md"
      p={3}
    >
      <HStack>
        <Icon as={icon} color={`${color}.400`} />
        <VStack align="start" gap={0}>
          <Text fontWeight="semibold">{code}</Text>
          <Text fontSize="sm" color="gray.500">
            {desc}
          </Text>
        </VStack>
      </HStack>

      <VStack align="end" gap={0}>
        <Badge colorScheme={color}>{qty}</Badge>
        <Text fontSize="xs" color="gray.500">
          {time}
        </Text>
      </VStack>
    </HStack>
  );
}

function ActivityItem({
  label,
  meta,
}: {
  label: string;
  meta: string;
}) {
  return (
    <HStack
      justify="space-between"
      borderWidth="1px"
      rounded="md"
      p={3}
    >
      <Text>{label}</Text>
      <Text fontSize="xs" color="gray.500">
        {meta}
      </Text>
    </HStack>
  );
}