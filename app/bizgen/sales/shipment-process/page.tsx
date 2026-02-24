"use client";

import { Box, Button, Card, createListCollection, Field, Flex, Grid, GridItem, Heading, HStack, Icon, Input, Portal, Select, Separator, SimpleGrid, Stack, Tag, Text, Textarea,} from "@chakra-ui/react";
import { FiFileText, FiPackage, FiTruck } from "react-icons/fi";
import { useEffect, useState } from "react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { getAllPort, GetPortData } from "@/lib/master/port";

export default function ShipmentProcessPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false); 
  
  const [mode, setMode] = useState<"create" | "view" | "edit">("create");

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //shipment type option
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
    })),
  });

  //set term selection
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  
  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
      label: `${term.term_name}`,
      value: term.term_id,
    })),
  });

  //set origin and destination origin selection
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);
    
  const portCollection = createListCollection({
    items: portOptions.map((port) => ({
      label: `${port.port_name} -  ${port.origin_name}`,
      value: port.port_id,
    })),
  });
  

  useEffect(() => {
    init();

    const fetchShipVia = async () => {
      try {
        setLoading(true);
        const shipViaRes = await getAllShipVia(1, 1000);
        setShipmentTypeOptions(shipViaRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setShipmentTypeOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPort = async () => {
      try {
        const portRes = await getAllPort(1, 1000);
        setPortOptions(portRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setPortOptions([]);
      }
    };

    const fetchTerm = async () => {
      try {
        const termRes = await getAllTerm(1, 1000);
        setTermOptions(termRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setTermOptions([]);
      }
    };

    fetchShipVia();
    fetchPort();
    fetchTerm();
  }, []);

  const init = async () => {
    setLoading(true);

    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    setLoading(false);
  }
    
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify={"space-between"}>
        <Flex flexDir={"column"}>
          <Heading size="lg">{t.sales_shipment_process.title}</Heading>
          <Text color="gray.600" mb={6} fontSize={"sm"}>{t.sales_shipment_process.description}</Text>
        </Flex>
        
        <Flex gap={"20px"}>
          {mode === "view" && (
            <Button onClick={() => setMode("edit")} variant="outline">{t.sales_shipment_process.edit}</Button>
          )}
          {(mode === "create" || mode === "edit") && (
            <>
              <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_shipment_process.save_draft}</Button>
              <Button bg="#E77A1F" color="white">{t.sales_shipment_process.save_continue}</Button>
            </>
          )}
        </Flex>
      </Flex>

      <Card.Root>
        <Card.Header>
          <Flex gap={4} alignItems={"center"}>
            <Icon as={FiTruck}/>
            <Heading fontSize={"md"}>{t.sales_shipment_process.shipment_overview}</Heading>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.job_booking_no}</Field.Label>
              <Input placeholder={t.sales_shipment_process.job_booking_no_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.shipment_type}</Field.Label>
                <Select.Root collection={shipmentTypeCollection} size="sm">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.shipment_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentTypeCollection.items.map((shipment) => (
                          <Select.Item item={shipment} key={shipment.value}>
                            {shipment.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.incoterm}</Field.Label>
                <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.incoterm_placeholder}/>
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                       <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {termCollection.items.map((term) => (
                          <Select.Item item={term} key={term.value}>{term.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.shipment_status}</Field.Label>
                <Select.Root collection={statusOptions} size="sm">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.shipment_status_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {statusOptions.items.map((status) => (
                          <Select.Item item={status} key={status.value}>
                            {status.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
      
      <Card.Root mt={5}>
        <Card.Header>
          <Flex gap={4} alignItems={"center"}>
            <Icon as={FiPackage}/>
            <Heading fontSize={"md"}>{t.sales_shipment_process.routing_container}</Heading>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.port_loading}</Field.Label>
                <Select.Root collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.sales_shipment_process.port_loading_placeholder} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {portCollection.items.map((port) => (
                          <Select.Item item={port} key={port.value}>{port.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
              </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.port_discharge}</Field.Label>
                <Select.Root collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_shipment_process.port_discharge_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {portCollection.items.map((port) => (
                          <Select.Item item={port} key={port.value}>{port.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.eta}</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.etd}</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.container_info}</Field.Label>
              <Textarea placeholder={t.sales_shipment_process.container_info_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.remarks}</Field.Label>
              <Textarea placeholder={t.sales_shipment_process.remarks_placeholder} />
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Flex gap={4} alignItems={"center"}>
            <Icon as={FiTruck}/>
            <Heading fontSize={"md"}>{t.sales_shipment_process.milestones}</Heading>
          </Flex>
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
            <SimpleGrid key={label} templateColumns={{ base: "1fr", md: "260px 1fr 200px" }} gap={3} alignItems="center" mb={4}>
              <Text>{label}</Text>
              <Textarea placeholder={t.sales_shipment_process.notes_optional} />
              <Input type="datetime-local" />
            </SimpleGrid>
          ))}
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Flex gap={4} alignItems={"center"}>
            <Icon as={FiFileText}/>
            <Heading fontSize={"md"}>{t.sales_shipment_process.shipment_documents}</Heading>
          </Flex>
          <Text color="gray.600" fontSize={"sm"}>{t.sales_shipment_process.shipment_documents_desc}</Text>
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
                      <Tag.Label>{t.sales_shipment_process.optional}</Tag.Label>
                    </Tag.Root>
                    <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>
                      {t.sales_shipment_process.view_replace}
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
              <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_shipment_process.save_draft}</Button>
              <Button colorScheme="blue" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>{t.sales_shipment_process.mark_completed}</Button>
            </Flex>
          )}
        </Flex>
    </SidebarWithHeader>
    
  );
}


const statusOptions = createListCollection({
  items: [
    { label: "Pending", value: "pending" },
    { label: "Ready for Pickup", value: "readyforpickup" },
    { label: "Port In", value: "portin" },
    { label: "On Board", value: "onboard" },
    { label: "Arrived", value: "arrived" },
    { label: "Delivered", value: "delivered" }
  ],
})