"use client";

import { Box, Button, Card, Field, Flex, Grid, GridItem, Heading, HStack, Icon, Input, Separator, SimpleGrid, Stack, Tag, Text, Textarea,} from "@chakra-ui/react";
import { FiFileText, FiPackage, FiTruck } from "react-icons/fi";
import { useEffect, useState } from "react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";

export default function ShipmentProcessPage() {
  const [mode, setMode] = useState<"create" | "view" | "edit">("create");

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    try {

    } catch (error: any){

    } finally {
      setLoading(false);
    }
  }
    
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify={"space-between"}>
        <Flex flexDir={"column"}>
          <Heading size="lg">Shipment Processing &amp; Documents</Heading>
          <Text color="gray.600" mb={6} fontSize={"sm"}>Manage shipment execution, milestones, and export/import documentation for this job.</Text>
        </Flex>
        
        <Flex gap={"20px"}>
          {mode === "view" && (
            <Button onClick={() => setMode("edit")} variant="outline">Edit</Button>
          )}
          {(mode === "create" || mode === "edit") && (
            <>
              <Button variant="outline">Save Draft</Button>
              <Button colorScheme="blue">Save &amp; Continue</Button>
            </>
          )}
        </Flex>
      </Flex>

      <Card.Root>
        <Card.Header>
          <Heading size="md"><Icon as={FiTruck}/> Shipment Overview</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label>Job / Booking No.</Field.Label>
              <Input placeholder="Auto / Manual input" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Shipment Type</Field.Label>
              {/* <Select placeholder="Select">
                  <option>FCL – Full Container Load</option>
                  <option>LCL – Less Container Load</option>
                  <option>Air Freight</option>
                  <option>Break Bulk</option>
                </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Incoterm</Field.Label>
              {/* <Select placeholder="Select">
                  <option>EXW</option>
                  <option>FOB</option>
                  <option>CFR</option>
                  <option>CIF</option>
                  <option>DDP</option>
                </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Shipment Status</Field.Label>
              {/* <Select placeholder="Select">
                  <option>Pending</option>
                  <option>Ready for Pickup</option>
                  <option>Port In</option>
                  <option>On Board</option>
                  <option>Arrived</option>
                  <option>Delivered</option>
                </Select> */}
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
      
      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md"><Icon as={FiPackage}/>Routing &amp; Container Details</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label>Port of Loading</Field.Label>
              <Input placeholder="e.g., Tanjung Priok" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Port of Discharge</Field.Label>
              <Input placeholder="e.g., Tanjung Priok" />
            </Field.Root>
            <Field.Root>
              <Field.Label>ETA</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>ETD</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Container / Package Info</Field.Label>
              <Textarea placeholder="20ft / 40ft, CBM, Weight, No. of packages…" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Remarks</Field.Label>
              <Textarea placeholder="Operation notes, handling instruction, etc." />
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md"><Icon as={FiTruck}/>Milestones Tracking</Heading>
        </Card.Header>
        <Card.Body>
          {[
            "Cargo Pickup",
            "Stuffing / Warehouse In",
            "Customs Declaration",
            "Port In",
            "On Board Vessel / Flight",
            "Arrival Port",
            "Delivery to Consignee",
          ].map((label) => (
            <SimpleGrid key={label} templateColumns={{ base: "1fr", md: "260px 1fr 200px" }} gap={3} alignItems="center">
              <Text>{label}</Text>
              <Input placeholder="Notes (optional)" />
              <Input type="datetime-local" />
            </SimpleGrid>
          ))}
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md"><Icon as={FiFileText}/>Shipment Documents</Heading>
          <Text color="gray.600" fontSize={"sm"}>Upload or manage required export / import documents.</Text>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
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
                  <Field.Root>
                    <Field.Label>{doc}</Field.Label>
                    <Tag.Root>
                      <Tag.Label>Optional</Tag.Label>
                    </Tag.Root>
                    <Button size="sm" variant="ghost">
                      View / Replace
                    </Button>
                  </Field.Root>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Flex justify="flex-end" mt={6}>
          {(mode === "create" || mode === "edit") && (
            <Flex gap={3}>
              <Button variant="outline">Save Draft</Button>
              <Button colorScheme="blue">Mark Shipment as Completed</Button>
            </Flex>
          )}
        </Flex>
    </SidebarWithHeader>
    
  );
}