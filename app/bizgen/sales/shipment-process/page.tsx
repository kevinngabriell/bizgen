

"use client";

import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  Select,
  Separator,
  Stack,
  Tag,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { FiUploadCloud, FiFileText, FiPackage, FiTruck } from "react-icons/fi";
import { useState } from "react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";

export default function ShipmentProcessPage() {
  const [mode, setMode] = useState<"create" | "view" | "edit">("create");

  return (
    <SidebarWithHeader username="---">
        <Box px={{ base: 4, md: 6 }} py={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Shipment Processing &amp; Documents</Heading>

        <HStack gap={3}>
          {mode === "view" && (
            <Button onClick={() => setMode("edit")} variant="outline">
              Edit
            </Button>
          )}
          {(mode === "create" || mode === "edit") && (
            <>
              <Button variant="outline">Save Draft</Button>
              <Button colorScheme="blue">Save &amp; Continue</Button>
            </>
          )}
        </HStack>
      </Flex>

      <Text color="gray.600" mb={6}>
        Manage shipment execution, milestones, and export/import documentation for this job.
      </Text>

      <Stack gap={6}>
        {/* Shipment Overview */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <Icon as={FiTruck} />
              <Heading size="md">Shipment Overview</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <GridItem>
                <Text fontWeight="medium">Job / Booking No.</Text>
                <Input placeholder="Auto / Manual input" />
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">Shipment Type</Text>
                {/* <Select placeholder="Select">
                  <option>FCL – Full Container Load</option>
                  <option>LCL – Less Container Load</option>
                  <option>Air Freight</option>
                  <option>Break Bulk</option>
                </Select> */}
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">Incoterm</Text>
                {/* <Select placeholder="Select">
                  <option>EXW</option>
                  <option>FOB</option>
                  <option>CFR</option>
                  <option>CIF</option>
                  <option>DDP</option>
                </Select> */}
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">Shipment Status</Text>
                {/* <Select placeholder="Select">
                  <option>Pending</option>
                  <option>Ready for Pickup</option>
                  <option>Port In</option>
                  <option>On Board</option>
                  <option>Arrived</option>
                  <option>Delivered</option>
                </Select> */}
              </GridItem>
            </Grid>
          </Card.Body>
        </Card.Root>

        {/* Routing & Container */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <Icon as={FiPackage} />
              <Heading size="md">Routing &amp; Container Details</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <GridItem>
                <Text fontWeight="medium">Port of Loading</Text>
                <Input placeholder="e.g., Tanjung Priok" />
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">Port of Discharge</Text>
                <Input placeholder="e.g., Singapore" />
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">ETA</Text>
                <Input type="date" />
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">ETD</Text>
                <Input type="date" />
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">Container / Package Info</Text>
                <Textarea placeholder="20ft / 40ft, CBM, Weight, No. of packages…" />
              </GridItem>

              <GridItem>
                <Text fontWeight="medium">Remarks</Text>
                <Textarea placeholder="Operation notes, handling instruction, etc." />
              </GridItem>
            </Grid>
          </Card.Body>
        </Card.Root>

        {/* Shipment Milestones */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <Icon as={FiTruck} />
              <Heading size="md">Milestones Tracking</Heading>
            </HStack>
          </Card.Header>
          <Card.Body>
            <Stack gap={3}>
              {[
                "Cargo Pickup",
                "Stuffing / Warehouse In",
                "Customs Declaration",
                "Port In",
                "On Board Vessel / Flight",
                "Arrival Port",
                "Delivery to Consignee",
              ].map((label) => (
                <Grid
                  key={label}
                  templateColumns={{ base: "1fr", md: "260px 1fr 200px" }}
                  gap={3}
                  alignItems="center"
                >
                  <Text>{label}</Text>
                  <Input placeholder="Notes (optional)" />
                  <Input type="datetime-local" />
                </Grid>
              ))}
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Documents Section */}
        <Card.Root>
          <Card.Header>
            <HStack>
              <Icon as={FiFileText} />
              <Heading size="md">Shipment Documents</Heading>
            </HStack>
          </Card.Header>

          <Card.Body>
            <Text color="gray.600" mb={3}>
              Upload or manage required export / import documents.
            </Text>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              {[
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading / AWB",
                "COO / Form",
                "Insurance Document",
                "Customs Declaration",
                "Gate Pass / DO",
                "Other Supporting Docs",
              ].map((doc) => (
                <Card.Root key={doc} variant="outline">
                  <Card.Body>
                    <Stack gap={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="medium">{doc}</Text>
                        {/* <Tag colorScheme="blue" variant="subtle">
                          Optional
                        </Tag> */}
                      </HStack>

                      {/* <InputGroup>
                        <InputLeftAddon>
                          <Icon as={FiUploadCloud} />
                        </InputLeftAddon>
                        <Input type="file" />
                      </InputGroup> */}

                      <Button size="sm" variant="ghost">
                        View / Replace
                      </Button>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Grid>
          </Card.Body>
        </Card.Root>

        <Separator />

        <Flex justify="flex-end">
          {(mode === "create" || mode === "edit") && (
            <HStack gap={3}>
              <Button variant="outline">Save Draft</Button>
              <Button colorScheme="blue">Mark Shipment as Completed</Button>
            </HStack>
          )}
        </Flex>
      </Stack>
    </Box>
    </SidebarWithHeader>
    
  );
}