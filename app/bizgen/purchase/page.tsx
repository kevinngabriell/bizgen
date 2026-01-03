"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, Card, Flex, Heading, Text, Grid, Box, Stack, HStack, Badge} from "@chakra-ui/react";

export default function Purchase (){
    return (
        <SidebarWithHeader username="kevin">
          <Flex gap={2} display={"flex"} mb={"6"} mt={"2"} alignItems={"center"}>
            <Heading flex="1">Purchase Module</Heading>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>+ Create New</Button>
          </Flex>

          {/* Cards grid — lighter, less compact */}
          <Grid
            gap={6}
            gridTemplateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          >

            {/* Request for Quotation */}
            <Card.Root>
              <Card.Body>
                <Flex mb="4" alignItems="center">
                  <Heading size="md" flex="1">Request for Quotation</Heading>
                  <Text fontSize="sm" cursor="pointer">See All</Text>
                </Flex>

                {/* Last 3 records preview */}
                <Stack gap="3">
                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">RFQ — PT Sumber Asia</Text>
                        <Text fontSize="sm" color="gray.500">Last updated • 12 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="blue" variant="subtle">Draft</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">RFQ — Indo Marine</Text>
                        <Text fontSize="sm" color="gray.500">Last updated • 11 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Sent</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">RFQ — Global Trading</Text>
                        <Text fontSize="sm" color="gray.500">Last updated • 09 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="orange" variant="subtle">Waiting</Badge>
                    </Flex>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Purchase Requisition */}
            <Card.Root>
              <Card.Body>
                <Flex mb="4" alignItems="center">
                  <Heading size="md" flex="1">Purchase Requisition</Heading>
                  <Text fontSize="sm" cursor="pointer">See All</Text>
                </Flex>

                <Stack gap="3">
                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PR-001245 — Packaging</Text>
                        <Text fontSize="sm" color="gray.500">Requested • 10 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="purple" variant="subtle">Pending</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PR-001231 — Spare Parts</Text>
                        <Text fontSize="sm" color="gray.500">Approved • 08 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Approved</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PR-001220 — Import Docs</Text>
                        <Text fontSize="sm" color="gray.500">Rejected • 06 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="red" variant="subtle">Rejected</Badge>
                    </Flex>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Purchase Order Local */}
            <Card.Root>
              <Card.Body>
                <Flex mb="4" alignItems="center">
                  <Heading size="md" flex="1">Purchase Order Local</Heading>
                  <Text fontSize="sm" cursor="pointer">See All</Text>
                </Flex>

                <Stack gap="3">
                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PO-LCL-1023 — PT Mekar Jaya</Text>
                        <Text fontSize="sm" color="gray.500">Issued • 09 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Open</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PO-LCL-1019 — Logistic Tape</Text>
                        <Text fontSize="sm" color="gray.500">Closed • 07 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="gray" variant="subtle">Closed</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PO-LCL-1018 — Pallet Wood</Text>
                        <Text fontSize="sm" color="gray.500">Open • 05 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Open</Badge>
                    </Flex>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Purchase Order Import */}
            <Card.Root>
              <Card.Body>
                <Flex mb="4" alignItems="center">
                  <Heading size="md" flex="1">Purchase Order Import</Heading>
                  <Text fontSize="sm" cursor="pointer">See All</Text>
                </Flex>

                <Stack gap="3">
                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PO-IMP-3007 — Shanghai Supplier</Text>
                        <Text fontSize="sm" color="gray.500">ETD • 18 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="orange" variant="subtle">In Transit</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PO-IMP-3004 — Guangzhou Parts</Text>
                        <Text fontSize="sm" color="gray.500">Arrived • 12 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Arrived</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">PO-IMP-2999 — Korea Steel</Text>
                        <Text fontSize="sm" color="gray.500">Waiting Doc • 09 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="purple" variant="subtle">Pending Doc</Badge>
                    </Flex>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Receiving Items */}
            <Card.Root>
              <Card.Body>
                <Flex mb="4" alignItems="center">
                  <Heading size="md" flex="1">Receiving Items</Heading>
                  <Text fontSize="sm" cursor="pointer">See All</Text>
                </Flex>

                <Stack gap="3">
                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">GR-2201 — Warehouse A</Text>
                        <Text fontSize="sm" color="gray.500">Received • 10 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Completed</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">GR-2198 — Warehouse B</Text>
                        <Text fontSize="sm" color="gray.500">Pending • 08 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="orange" variant="subtle">Pending</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">GR-2197 — Cross Dock</Text>
                        <Text fontSize="sm" color="gray.500">Scheduled • 07 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="blue" variant="subtle">Scheduled</Badge>
                    </Flex>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Purchase Invoice */}
            <Card.Root>
              <Card.Body>
                <Flex mb="4" alignItems="center">
                  <Heading size="md" flex="1">Purchase Invoice</Heading>
                  <Text fontSize="sm" cursor="pointer">See All</Text>
                </Flex>

                <Stack gap="3">
                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">INV-98021 — PT Sumber Asia</Text>
                        <Text fontSize="sm" color="gray.500">Due • 15 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="red" variant="subtle">Unpaid</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">INV-97988 — Indo Marine</Text>
                        <Text fontSize="sm" color="gray.500">Paid • 09 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="green" variant="subtle">Paid</Badge>
                    </Flex>
                  </Box>

                  <Box borderWidth="1px" borderRadius="md" px="3" py="2">
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="medium">INV-97970 — Global Trading</Text>
                        <Text fontSize="sm" color="gray.500">Pending • 07 Jan 2026</Text>
                      </Box>
                      <Badge colorPalette="orange" variant="subtle">Pending</Badge>
                    </Flex>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

          </Grid>
        </SidebarWithHeader>
    );
}