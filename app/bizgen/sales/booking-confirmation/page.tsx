'use client';

import Loading from '@/components/loading';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { Box, Button, Card, Flex, Heading, Icon, Input, Stack, Text, Textarea, Badge, SimpleGrid, Separator, Field, createListCollection, Select, Portal } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';
import { FiFileText } from 'react-icons/fi';

export default function BookingConfirmationPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [isEdit, setIsEdit] = useState(true);

  //shipment type option
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
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

  //set term selection
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  
  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
      label: `${term.term_name}`,
      value: term.term_id,
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
      
      <Box p={{ base: 4, md: 6 }} maxW="1280px" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">{t.booking_confirmation.title}</Heading>

        <SimpleGrid gap={3}>
          <Badge fontSize="sm">{t.booking_confirmation.draft}</Badge>
          <Button variant="outline" color={"#E77A1F"} borderColor={"#E77A1F"} onClick={() => setIsEdit(false)}>{t.booking_confirmation.save_draft}</Button>
          <Button bg="#E77A1F" color="white">{t.booking_confirmation.confirm_create_job}</Button>
        </SimpleGrid>
      </Flex>

      <Stack gap={6}>
        {/* Job Meta */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{t.booking_confirmation.job_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.booking_no}</Field.Label>
                <Input placeholder={t.booking_confirmation.booking_no_placeholder}  />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}>{t.booking_confirmation.job_type}</Field.Label>
                <Select.Root collection={jobTypeOptions} size="sm">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.booking_confirmation.job_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {jobTypeOptions.items.map((jobType) => (
                          <Select.Item item={jobType} key={jobType.value}>
                            {jobType.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.service} </Field.Label>
                <Select.Root collection={shipmentTypeCollection} size="sm">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.booking_confirmation.service_placeholder} />
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
            </SimpleGrid>

            <SimpleGrid column={{ base: '1fr', md: '1fr 1fr' }} gap={4} mt={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.estimated_departure} </Field.Label>
                <Input type="date" />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.estimated_arrival} </Field.Label>
                <Input type="date" />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Parties */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{t.booking_confirmation.parties_information}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid column={{ base: 1, md: 2 }} gap={6}>


              <Field.Root>
                <Field.Label mb={2}>{t.booking_confirmation.shipper}</Field.Label>
                <Stack gap={2} w={"100%"}>
                  <Input placeholder={t.booking_confirmation.company_name_placeholder} />
                  <Input placeholder={t.booking_confirmation.contact_person_placeholder} />
                  <Textarea placeholder={t.booking_confirmation.address_placeholder} rows={3} />
                </Stack>
              </Field.Root>

              <Field.Root>
                <Field.Label mb={2}> {t.booking_confirmation.consignee} </Field.Label>
                <Stack gap={2} w={"100%"}>
                  <Input placeholder={t.booking_confirmation.company_name_placeholder} />
                  <Input placeholder={t.booking_confirmation.contact_person_placeholder} />
                  <Textarea placeholder={t.booking_confirmation.address_placeholder} rows={3} />
                </Stack>
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Routing & Cargo */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">{t.booking_confirmation.routing_cargo}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}>{t.booking_confirmation.origin_port}</Field.Label>
                <Select.Root collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.booking_confirmation.origin_port_placeholder} />
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
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.destination_port} </Field.Label>
                <Select.Root collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.booking_confirmation.destination_port_placeholder} />
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
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.incoterm} </Field.Label>
                <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.booking_confirmation.incoterm_placeholder}/>
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
            </SimpleGrid>

            <Separator my={4} />

            <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.package_type} </Field.Label>
                <Input placeholder={t.booking_confirmation.package_type_placeholder} />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.total_packages} </Field.Label>
                <Input type="number" placeholder={t.booking_confirmation.total_packages_placeholder} />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.gross_weight} </Field.Label>
                <Input type="number" placeholder={t.booking_confirmation.gross_weight_placeholder} />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> {t.booking_confirmation.cbm} </Field.Label>
                <Input type="number" placeholder={t.booking_confirmation.cbm_placeholder} />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Charges Summary */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">{t.booking_confirmation.charges_summary}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Text fontSize="sm" mb={1}>
                  {t.booking_confirmation.freight_charge}
                </Text>
                <Input type="number" placeholder="0" />
              </Field.Root>
              <Field.Root>
                <Text fontSize="sm" mb={1}>
                  {t.booking_confirmation.local_charge}
                </Text>
                <Input type="number" placeholder="0" />
              </Field.Root>
              <Field.Root>
                <Text fontSize="sm" mb={1}>
                  {t.booking_confirmation.other_charge}
                </Text>
                <Input type="number" placeholder="0" />
              </Field.Root>
            </SimpleGrid>

            <Field.Root mt={4}>
              <Text fontSize="sm" mb={1}>
                {t.booking_confirmation.remarks_placeholder}
              </Text>
              <Textarea rows={3} placeholder={t.booking_confirmation.remarks_placeholder} />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Attachments */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">{t.booking_confirmation.attachments}</Heading>
          </Card.Header>
          <Card.Body>
            <Flex
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="lg"
              p={6}
              align="center"
              justify="center"
              direction="column"
              gap={2}
              textAlign="center"
            >
              <Icon as={FiFileText} boxSize={8} color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                {t.booking_confirmation.upload_documents}
              </Text>
              <Button size="sm" variant="outline">
                {t.booking_confirmation.choose_file}
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Box>
    </SidebarWithHeader>
    
  );
}

const jobTypeOptions = createListCollection({
  items: [
    { label: "Export", value: "export" },
    { label: "Import", value: "import" },
    { label: "Domestic", value: "domestic" }
  ],
})