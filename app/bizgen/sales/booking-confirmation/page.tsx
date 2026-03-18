'use client';

import Loading from '@/components/loading';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { createSalesJobOrder, generateSalesBookingNumber } from '@/lib/sales/booking-confirmation';
import { Button, Card, Flex, Heading, Icon, Input, Stack, Text, Textarea, SimpleGrid, Separator, Field, createListCollection, Select, Portal } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, ChangeEvent, Suspense } from 'react';
import { FiFileText } from 'react-icons/fi';

type BookMode = "create" | "view" | "edit";

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BookingConfirmationContent />
    </Suspense>
  );
}

function BookingConfirmationContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const bookingID = searchParams.get("booking_id");

  const [bookingStatus, setBookingStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const [mode, setMode] = useState<BookMode>("create");
  const isReadOnly = mode === "view" && bookingStatus !== "draft" && bookingStatus !== "rejected";
  
  //shipment type option
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);
  const [jobTypeSelected, setJobTypeSelected] = useState<string>();
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();

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

  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const loadMaster = async () => {
      try {
        setLoading(true);

        await init();

        const [
          shipViaRes, portRes, termRes
        ] = await Promise.all([
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllTerm(1, 1000)
        ]);

        setShipmentTypeOptions(shipViaRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);
      } catch (err){
        console.error(err);
      }
    }

    const loadDetail = async () => {
      if (!bookingID) return;
    }

    const loadGeneratedNumber = async () => {
      if (bookingID) return; // kalau ada rfqId, jangan generate (view/edit mode)
    
      try {
        const res = await generateSalesBookingNumber();
        setForm(prev => ({
          ...prev,
          booking_no: res.number,
        }));
      } catch (err) {
        console.error("Failed to generate RFQ number", err);
      }
    };

    const loadAll = async () => {
      try {
        setLoading(true);
        await loadMaster();
        await loadDetail();
        await loadGeneratedNumber();
      } finally {
        setLoading(false);
      }
    };

    loadAll();

  }, [bookingID]);

  const init = async () => {
    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);
  }

  const [form, setForm] = useState({
    booking_no: "",
    estimated_departure: "",
    estimated_arrival: "",
    shipper_company: "",
    shipper_contact: "",
    shipper_address: "",
    consignee_company: "",
    consignee_contact: "",
    consignee_address: "",
    package_type: "",
    total_packages: "",
    gross_weight: "",
    cbm: "",
    freight_charge: "",
    local_charge: "",
    other_charge: "",
    remarks: ""
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!form.booking_no) {
        throw new Error("Booking number is required");
      }
      if (!jobTypeSelected) {
        throw new Error("Job type is required");
      }
      if (!shipmentTypeSelected) {
        throw new Error("Service / shipment type is required");
      }
      if (!originSelected) {
        throw new Error("Origin port is required");
      }
      if (!destinationSelected) {
        throw new Error("Destination port is required");
      }
      if (!termSelected) {
        throw new Error("Term is required");
      }
      if (originSelected === destinationSelected) {
        throw new Error("Origin and destination port cannot be the same");
      }
      const grossWeight = Number(form.gross_weight) || 0;
      const cbm = Number(form.cbm) || 0;
      if (grossWeight <= 0 && cbm <= 0) {
        throw new Error("Either Gross Weight or CBM must be greater than 0");
      }
      if (Number(form.total_packages) < 0) {
        throw new Error("Total packages cannot be negative");
      }
      if (Number(form.freight_charge) < 0 || Number(form.local_charge) < 0 || Number(form.other_charge) < 0) {
        throw new Error("Charges cannot be negative");
      }

      setLoading(true);

      const payload = {
        job_order_number: form.booking_no,
        job_type: jobTypeSelected,
        ship_via_id: shipmentTypeSelected,
        estimated_departure: form.estimated_departure,
        estimated_arrival : form.estimated_arrival,
        shipper_company: form.shipper_company,
        shipper_contact: form.shipper_contact,
        shipper_address: form.shipper_address,
        consignee_company : form.consignee_company,
        consignee_contact: form.consignee_contact,
        consignee_address: form.consignee_address,
        origin_port: originSelected,
        destination_port : destinationSelected,
        incoterm: termSelected ?? "",
        package_type: form.package_type,
        total_packages: form.total_packages,
        gross_weight: form.gross_weight,
        cbm: form.cbm,
        freight_charge: form.freight_charge,
        local_charge: form.local_charge,
        other_charge: form.other_charge,
        remarks: form.remarks,
      }

      const res = await createSalesJobOrder(payload);

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup("Success");
      setMessagePopup("Sales job order created successfully");
      setTimeout(() => setShowAlert(false), 6000);
      setForm({
        booking_no: "",
        estimated_departure: "",
        estimated_arrival: "",
        shipper_company: "",
        shipper_contact: "",
        shipper_address: "",
        consignee_company: "",
        consignee_contact: "",
        consignee_address: "",
        package_type: "",
        total_packages: "",
        gross_weight: "",
        cbm: "",
        freight_charge: "",
        local_charge: "",
        other_charge: "",
        remarks: ""
      });
      setJobTypeSelected(undefined);
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setTermSelected(undefined);

    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup("Error");
      setMessagePopup(err.message || "Failed to create booking order");
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between">
        <Heading size="lg" w={"100%"}>{t.booking_confirmation.title}</Heading>
        
        <Flex gap={3}>
          <Button variant="outline" color={"#E77A1F"} borderColor={"#E77A1F"} onClick={handleSave}>{t.booking_confirmation.save_draft}</Button>
          <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.booking_confirmation.confirm_create_job}</Button>
        </Flex>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}

      <Stack gap={6} mt={4}>
        {/* Job Meta */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{t.booking_confirmation.job_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label fontSize="sm">{t.booking_confirmation.booking_no}<Field.RequiredIndicator/></Field.Label>
                <Input name="booking_no" value={form.booking_no} onChange={handleInputChange} placeholder={t.booking_confirmation.booking_no_placeholder}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label fontSize="sm">{t.booking_confirmation.job_type}<Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={jobTypeOptions} value={jobTypeSelected ? [jobTypeSelected] : []}
                  onValueChange={(details) => setJobTypeSelected(details.value[0])}
                >
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
              <Field.Root required>
                <Field.Label fontSize="sm">{t.booking_confirmation.service}<Field.RequiredIndicator/></Field.Label>
                <Select.Root
                  collection={shipmentTypeCollection}
                  value={shipmentTypeSelected ? [shipmentTypeSelected] : []}
                  onValueChange={(details) => setShipmentTypeSelected(details.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.booking_confirmation.service_placeholder}/>
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
                <Field.Label fontSize="sm">{t.booking_confirmation.estimated_departure}</Field.Label>
                <Input type="date" name="estimated_departure" value={form.estimated_departure} onChange={handleInputChange}/>
              </Field.Root>              
              <Field.Root>
                <Field.Label fontSize="sm">{t.booking_confirmation.estimated_arrival}</Field.Label>
                <Input type="date" name="estimated_arrival" value={form.estimated_arrival} onChange={handleInputChange}/>
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm">Inquiry No</Field.Label>
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
                <Field.Label>{t.booking_confirmation.shipper}</Field.Label>
                <Stack gap={2} w={"100%"}>
                  <Input name="shipper_company" value={form.shipper_company} onChange={handleInputChange} placeholder={t.booking_confirmation.company_name_placeholder}/>
                  <Input name="shipper_contact" value={form.shipper_contact} onChange={handleInputChange} placeholder={t.booking_confirmation.contact_person_placeholder}/>
                  <Textarea name="shipper_address" value={form.shipper_address} onChange={handleInputChange} rows={3} placeholder={t.booking_confirmation.address_placeholder}/>
                </Stack>
              </Field.Root>
              <Field.Root>
                <Field.Label> {t.booking_confirmation.consignee} </Field.Label>
                <Stack gap={2} w={"100%"}>
                  <Input name="consignee_company" value={form.consignee_company} onChange={handleInputChange} placeholder={t.booking_confirmation.company_name_placeholder}/>
                  <Input name="consignee_contact" value={form.consignee_contact} onChange={handleInputChange} placeholder={t.booking_confirmation.contact_person_placeholder}/>
                  <Textarea name="consignee_address" value={form.consignee_address} onChange={handleInputChange} rows={3} placeholder={t.booking_confirmation.address_placeholder}/>
                </Stack>
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Routing & Cargo */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="md">{t.booking_confirmation.routing_cargo}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label fontSize="sm">{t.booking_confirmation.origin_port} <Field.RequiredIndicator/> </Field.Label>
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
              <Field.Root required>
                <Field.Label fontSize="sm"> {t.booking_confirmation.destination_port} <Field.RequiredIndicator/></Field.Label>
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
              <Field.Root required>
                <Field.Label fontSize="sm"> {t.booking_confirmation.incoterm}<Field.RequiredIndicator/> </Field.Label>
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
                <Field.Label fontSize="sm">{t.booking_confirmation.package_type}</Field.Label>
                <Input name="package_type" value={form.package_type} onChange={handleInputChange} placeholder={t.booking_confirmation.package_type_placeholder}/>
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm">{t.booking_confirmation.total_packages}</Field.Label>
                <Input type="number" name="total_packages" value={form.total_packages} onChange={handleInputChange} placeholder={t.booking_confirmation.total_packages_placeholder}/>
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm"> {t.booking_confirmation.gross_weight}</Field.Label>
                <Input type="number" name="gross_weight" value={form.gross_weight} onChange={handleInputChange} placeholder={t.booking_confirmation.gross_weight_placeholder}/>
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm"> {t.booking_confirmation.cbm}</Field.Label>
                <Input type="number" name="cbm" value={form.cbm} onChange={handleInputChange} placeholder={t.booking_confirmation.cbm_placeholder}/>
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Charges Summary */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{t.booking_confirmation.charges_summary}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Text fontSize="sm">{t.booking_confirmation.freight_charge}</Text>
                <Input type="number" name="freight_charge" value={form.freight_charge} onChange={handleInputChange} placeholder="0"/>
              </Field.Root>
              <Field.Root>
                <Text fontSize="sm"> {t.booking_confirmation.local_charge}</Text>
                <Input type="number" name="local_charge" value={form.local_charge} onChange={handleInputChange} placeholder="0"/>
              </Field.Root>
              <Field.Root>
                <Text fontSize="sm">{t.booking_confirmation.other_charge}</Text>
                <Input type="number" name="other_charge" value={form.other_charge} onChange={handleInputChange} placeholder="0"/>
              </Field.Root>
            </SimpleGrid>

            <Field.Root mt={4}>
              <Text fontSize="sm"> {t.booking_confirmation.remarks_placeholder}</Text>
              <Textarea name="remarks" value={form.remarks} onChange={handleInputChange} rows={3} placeholder={t.booking_confirmation.remarks_placeholder}/>
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Attachments */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="md">{t.booking_confirmation.attachments}</Heading>
          </Card.Header>
          <Card.Body>
            <Flex border="1px dashed" borderColor="gray.300" borderRadius="lg" p={6} align="center" justify="center" direction="column" gap={2} textAlign="center">
              <Icon as={FiFileText} boxSize={8} color="gray.500" />
              <Text fontSize="sm" color="gray.600">{t.booking_confirmation.upload_documents}</Text>
              <Button size="sm" variant="outline">{t.booking_confirmation.choose_file}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Stack>
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