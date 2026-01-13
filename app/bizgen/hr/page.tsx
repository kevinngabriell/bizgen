"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Box, Flex, Heading, SimpleGrid, Stat, Card, Text, HStack, Button, Badge, Separator } from "@chakra-ui/react";

export default function HR() {
  return (
    <SidebarWithHeader username="kevin">
      <Flex direction="column" mb={4}>
        <Heading size="lg" mb={1}>HR Dashboard</Heading>
        <Text fontSize="sm" color="gray.500">Lightweight HR overview for team & compliance</Text>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
          <Card.Root>
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Total Employees</Stat.Label>
                <Stat.ValueUnit>18</Stat.ValueUnit>
                <Stat.HelpText>Active Workforce</Stat.HelpText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Drivers & Field Staff</Stat.Label>
                <Stat.ValueUnit>7</Stat.ValueUnit>
                <Stat.HelpText>Operational Roles</Stat.HelpText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Pending Documents</Stat.Label>
                <Stat.ValueUnit>3</Stat.ValueUnit>
                <Stat.HelpText>Licenses & Compliance</Stat.HelpText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

<SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          {/* Employee Directory Preview */}
          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Heading size="sm">Employee Directory</Heading>
                <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See all</Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Flex direction="column" gap={3}>
                <HStack>
                  {/* <Avatar size="sm" name="Andi Pratama" /> */}
                  <Box>
                    <Text fontWeight="semibold">Andi Pratama</Text>
                    <Text fontSize="sm" color="gray.500">
                      Operations Supervisor
                    </Text>
                  </Box>
                  <Badge ml="auto" colorScheme="green">
                    Active
                  </Badge>
                </HStack>

                {/* <Divider /> */}

                <HStack>
                  {/* <Avatar size="sm" name="Rina Sari" /> */}
                  <Box>
                    <Text fontWeight="semibold">Rina Sari</Text>
                    <Text fontSize="sm" color="gray.500">
                      Finance & Billing
                    </Text>
                  </Box>
                  <Badge ml="auto" colorScheme="green">
                    Active
                  </Badge>
                </HStack>

                {/* <Divider /> */}

                <HStack>
                  {/* <Avatar size="sm" name="Budi Setiawan" /> */}
                  <Box>
                    <Text fontWeight="semibold">Budi Setiawan</Text>
                    <Text fontSize="sm" color="gray.500">
                      Warehouse Staff
                    </Text>
                  </Box>
                  <Badge ml="auto" colorScheme="yellow">
                    Contract
                  </Badge>
                </HStack>
              </Flex>
            </Card.Body>
          </Card.Root>

          {/* Compliance & Activity */}
          <Card.Root>
            <Card.Header>
              <Heading size="sm">Compliance & Recent Activity</Heading>
            </Card.Header>
            <Card.Body>
              <Flex direction="column" gap={4}>
                <Box>
                  <Text fontWeight="medium">Expiring Documents</Text>
                  <Text fontSize="sm" color="gray.500">Driver License — 2 expiring soon</Text>
                  <Text fontSize="sm" color="gray.500">ID & Employment Docs — 1 pending renewal</Text>
                </Box>

                <Separator />

                <Box>
                  <Text fontWeight="medium">Recent HR Updates</Text>
                  <Text fontSize="sm" color="gray.600">• New employee added to Operations team</Text>
                  <Text fontSize="sm" color="gray.600">• Warehouse staff contract updated</Text>
                  <Text fontSize="sm" color="gray.600">• Driver license verification completed</Text>
                </Box>
              </Flex>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
     
    </SidebarWithHeader>
  );
}