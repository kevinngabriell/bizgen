'use client';

import Loading from '@/components/loading';
import InquiryLookup from "@/components/lookup/SalesInquiryLookup";
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import RejectDialog from '@/components/dialog/RejectDialog';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { createSalesJobOrder, generateSalesBookingNumber, getDetailJobOrder, updateJobOrder, processJobOrderAction, GetDetailJobOrderHistory } from '@/lib/sales/booking-confirmation';
import { Badge, Button, Card, Flex, Heading, Icon, Input, Stack, Text, Textarea, SimpleGrid, Separator, Field, createListCollection, Select, Portal } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, ChangeEvent, Suspense } from 'react';
import { FiFileText } from 'react-icons/fi';
import { GetRfq } from "@/lib/sales/rfq";

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

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const searchParams = useSearchParams();
  const bookingID = searchParams.get("booking_id");

  const [bookingDetailId, setBookingDetailId] = useState<string>();
  const [bookingStatus, setBookingStatus] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [lastUpdatedBy, setlastUpdatedBy] = useState<string>();
  const [historyData, setHistoryData] = useState<GetDetailJobOrderHistory[]>([]);
  const [linkedInquiry, setLinkedInquiry] = useState("");

  const [mode, setMode] = useState<BookMode>("create");
  const isReadOnly = mode === "view" && bookingStatus !== "draft" && bookingStatus !== "cancelled";

  // reject dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // shipment type
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);
  const [jobTypeSelected, setJobTypeSelected] = useState<string>();
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
    })),
  });

  // ports
  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);

  const portCollection = createListCollection({
    items: portOptions.map((port) => ({
      label: `${port.port_name} -  ${port.origin_name}`,
      value: port.port_id,
    })),
  });

  // terms
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);

  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
      label: `${term.term_name}`,
      value: term.term_id,
    })),
  });

  // inquiry lookup
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [linkedInquiryID, setLinkedInquiryID] = useState("");

  // alert
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showSuccess = (msg: string) => {
    setShowAlert(true); setIsSuccess(true);
    setTitlePopup(t.master.success); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const showError = (msg: string) => {
    setShowAlert(true); setIsSuccess(false);
    setTitlePopup(t.master.error); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;
        const info = getAuthInfo();
        setAuth(info);
        const language = info?.language === "id" ? "id" : "en";
        setLang(language);

        const [shipViaRes, portRes, termRes] = await Promise.all([
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllTerm(1, 1000),
        ]);

        const shipViaData = shipViaRes?.data ?? [];
        const portData = portRes?.data ?? [];
        const termData = termRes?.data ?? [];

        setShipmentTypeOptions(shipViaData);
        setPortOptions(portData);
        setTermOptions(termData);

        if (bookingID) {
          setMode("view");
          const res = await getDetailJobOrder(bookingID);

          setBookingDetailId(res.header.job_order_id);
          setBookingStatus(res.header.status);
          setlastUpdatedBy(res.header.updated_by);
          setLastUpdatedAt(res.header.updated_at);
          setLinkedInquiry(res.header.rfq_no ?? "");

          setForm(prev => ({
            ...prev,
            booking_no: res.header.job_order_no,
            shipper_company: res.header.shipper_name ?? "",
            consignee_company: res.header.consignee_name ?? "",
            gross_weight: res.header.gross_weight_kg ? String(res.header.gross_weight_kg) : "",
            cbm: res.header.cbm_volume ? String(res.header.cbm_volume) : "",
          }));

          setJobTypeSelected(res.header.job_type);

          const matchedShipVia = shipViaData.find(sv => sv.ship_via_name === res.header.ship_via_name);
          if (matchedShipVia) setShipmentTypeSelected(matchedShipVia.ship_via_id);

          const matchedOrigin = portData.find(p => p.port_name === res.header.origin_port_name);
          if (matchedOrigin) setOriginSelected(matchedOrigin.port_id);

          const matchedDest = portData.find(p => p.port_name === res.header.destination_port_name);
          if (matchedDest) setDestinationSelected(matchedDest.port_id);

          const matchedTerm = termData.find(tm => tm.term_name === res.header.term_name);
          if (matchedTerm) setTermSelected(matchedTerm.term_id);

          setHistoryData(res.history ?? []);
        } else {
          const res = await generateSalesBookingNumber();
          setForm(prev => ({ ...prev, booking_no: res.number }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [bookingID]);

  const handleChooseInquiry = async (rfq: GetRfq) => {
    try {
      setLoading(true);
      setLinkedInquiry(rfq.rfq_no);
      setLinkedInquiryID(rfq.inquiry_id);
    } catch (error) {
      console.error("Failed to bind inquiry", error);
    } finally {
      setLoading(false);
      setInquiryModalOpen(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.booking_no)        
        throw new Error(t.booking_confirmation.error_1);
      if (!jobTypeSelected)        
        throw new Error(t.booking_confirmation.error_2);
      if (!shipmentTypeSelected)   
        throw new Error(t.booking_confirmation.error_3);
      if (!originSelected)         
        throw new Error(t.booking_confirmation.error_4);
      if (!destinationSelected)    
        throw new Error(t.booking_confirmation.error_5);
      if (!termSelected)           
        throw new Error(t.booking_confirmation.error_6);
      if (originSelected === destinationSelected) 
        throw new Error(t.booking_confirmation.error_7);
      if (Number(form.gross_weight) <= 0 && Number(form.cbm) <= 0) 
        throw new Error(t.booking_confirmation.error_8);
      if (Number(form.total_packages) < 0)  
        throw new Error(t.booking_confirmation.error_9);
      if (Number(form.freight_charge) < 0 || Number(form.local_charge) < 0 || Number(form.other_charge) < 0)
        throw new Error(t.booking_confirmation.error_10);

      setLoading(true);

      await createSalesJobOrder({
        job_order_number: form.booking_no,
        job_type: jobTypeSelected,
        ship_via_id: shipmentTypeSelected,
        estimated_departure: form.estimated_departure,
        estimated_arrival: form.estimated_arrival,
        shipper_company: form.shipper_company,
        shipper_contact: form.shipper_contact,
        shipper_address: form.shipper_address,
        consignee_company: form.consignee_company,
        consignee_contact: form.consignee_contact,
        consignee_address: form.consignee_address,
        origin_port: originSelected,
        destination_port: destinationSelected,
        incoterm: termSelected ?? "",
        package_type: form.package_type,
        total_packages: form.total_packages,
        gross_weight: form.gross_weight,
        cbm: form.cbm,
        freight_charge: form.freight_charge,
        local_charge: form.local_charge,
        other_charge: form.other_charge,
        remarks: form.remarks,
        inquiry_id: linkedInquiryID,
      });

      showSuccess(t.booking_confirmation.success_draft);

      setForm({ booking_no: "", estimated_departure: "", estimated_arrival: "", shipper_company: "", shipper_contact: "", shipper_address: "", consignee_company: "", consignee_contact: "", consignee_address: "", package_type: "", total_packages: "", gross_weight: "", cbm: "", freight_charge: "", local_charge: "", other_charge: "", remarks: "" });
      setJobTypeSelected(undefined);
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setTermSelected(undefined);
      setLinkedInquiry("");
      setLinkedInquiryID("");
    } catch (err: any) {
      showError(err.message || t.booking_confirmation.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!bookingDetailId) throw new Error("Booking ID not found");
      setLoading(true);

      await updateJobOrder({
        booking_id: bookingDetailId,
        ship_via_id: shipmentTypeSelected,
        estimate_depature_date: form.estimated_departure,
        estimate_arrival_date: form.estimated_arrival,
        shipper_name: form.shipper_company,
        shipper_contact: form.shipper_contact,
        shipper_address: form.shipper_address,
        consignee_name: form.consignee_company,
        consignee_contact: form.consignee_contact,
        consignee_address: form.consignee_address,
        origin_port: originSelected,
        destination_port: destinationSelected,
        term_id: termSelected,
        package_type: form.package_type,
        total_package: form.total_packages,
        gross_weight_kg: form.gross_weight,
        cbm_volume: form.cbm,
        freight_charge: form.freight_charge,
        local_charge: form.local_charge,
        other_charge: form.other_charge,
        remarks: form.remarks,
      });

      showSuccess("Booking updated successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to update booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBooking = async () => {
    try {
      if (!bookingDetailId) throw new Error("Booking ID not found");
      setLoading(true);

      await processJobOrderAction({ booking_id: bookingDetailId, action: "submit" });

      setBookingStatus("submitted");
      showSuccess("Booking submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!bookingDetailId) throw new Error("Booking ID not found");
      setLoading(true);

      await processJobOrderAction({ booking_id: bookingDetailId, action: "approve" });

      setBookingStatus("confirmed");
      showSuccess("Booking approved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to approve booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!bookingDetailId) throw new Error("Booking ID not found");
      setRejectLoading(true);

      await processJobOrderAction({ booking_id: bookingDetailId, action: "reject", notes: reason });

      setIsRejectDialogOpen(false);
      setBookingStatus("cancelled");
      showSuccess("Booking rejected successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to reject booking.");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
        <InquiryLookup isOpen={inquiryModalOpen} onClose={() => setInquiryModalOpen(false)} onChoose={handleChooseInquiry} />

        <Flex direction="column">
          <Heading size="lg">{t.booking_confirmation.title}</Heading>

          {mode === "view" && (
            <Card.Root mt={3}>
              <Card.Body>
                <Flex justifyContent="space-between">
                  <Badge variant="solid" colorPalette={bookingStatus === "confirmed" ? "green" : bookingStatus === "cancelled" ? "red" : bookingStatus === "submitted" ? "blue" : "yellow"}>{bookingStatus ? bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1) : ""}</Badge>
                  <Text fontSize="xs" color="gray.600">
                    {t.master.last_update_by} <b>{lastUpdatedBy}</b> •{" "}
                    {lastUpdatedAt
                      ? new Date(lastUpdatedAt).toLocaleDateString(
                          lang === "id" ? "id-ID" : "en-US",
                          { day: "2-digit", month: "short", year: "numeric" }
                        )
                      : "-"}
                  </Text>
                </Flex>
              </Card.Body>
            </Card.Root>
          )}
        </Flex>

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

        <Stack gap={6} mt={4}>
          {/* Job Meta */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t.booking_confirmation.job_details}</Heading>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root required>
                  <Field.Label fontSize="sm">{t.booking_confirmation.booking_no}<Field.RequiredIndicator /></Field.Label>
                  <Input name="booking_no" value={form.booking_no} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.booking_no_placeholder} />
                </Field.Root>
                <Field.Root required>
                  <Field.Label fontSize="sm">{t.booking_confirmation.job_type}<Field.RequiredIndicator /></Field.Label>
                  <Select.Root disabled={isReadOnly} collection={jobTypeOptions} value={jobTypeSelected ? [jobTypeSelected] : []} onValueChange={(details) => setJobTypeSelected(details.value[0])}>
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
                              {jobType.label}<Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
                <Field.Root required>
                  <Field.Label fontSize="sm">{t.booking_confirmation.service}<Field.RequiredIndicator /></Field.Label>
                  <Select.Root disabled={isReadOnly} collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []} onValueChange={(details) => setShipmentTypeSelected(details.value[0])}>
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
                              {shipment.label}<Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.estimated_departure}</Field.Label>
                  <Input type="date" name="estimated_departure" value={form.estimated_departure} onChange={handleInputChange} readOnly={isReadOnly} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.estimated_arrival}</Field.Label>
                  <Input type="date" name="estimated_arrival" value={form.estimated_arrival} onChange={handleInputChange} readOnly={isReadOnly} />
                </Field.Root>
                <Field.Root required>
                  <Field.Label fontSize="sm">{t.booking_confirmation.inquiry_no}<Field.RequiredIndicator /></Field.Label>
                  <Input
                    placeholder={t.booking_confirmation.inquiry_no}
                    value={linkedInquiry}
                    readOnly
                    cursor={isReadOnly ? "default" : "pointer"}
                    onClick={() => !isReadOnly && setInquiryModalOpen(true)}
                  />
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
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <Field.Root>
                  <Field.Label>{t.booking_confirmation.shipper}</Field.Label>
                  <Stack gap={2} w="100%">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={3}>
                      <Field.Root>
                        <Field.Label>{t.booking_confirmation.company_name}</Field.Label>
                        <Input name="shipper_company" value={form.shipper_company} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.company_name_placeholder} />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>{t.booking_confirmation.contact_person}</Field.Label>
                        <Input name="shipper_contact" value={form.shipper_contact} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.contact_person_placeholder} />
                      </Field.Root>
                    </SimpleGrid>
                    <Field.Root>
                      <Field.Label>{t.booking_confirmation.address}</Field.Label>
                      <Textarea name="shipper_address" value={form.shipper_address} onChange={handleInputChange} readOnly={isReadOnly} rows={3} placeholder={t.booking_confirmation.address_placeholder} />
                    </Field.Root>
                  </Stack>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.booking_confirmation.consignee}</Field.Label>
                  <Stack gap={2} w="100%">
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={3}>
                      <Field.Root>
                        <Field.Label>{t.booking_confirmation.company_name}</Field.Label>
                        <Input name="consignee_company" value={form.consignee_company} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.company_name_placeholder} />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>{t.booking_confirmation.contact_person}</Field.Label>
                        <Input name="consignee_contact" value={form.consignee_contact} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.contact_person_placeholder} />
                      </Field.Root>
                    </SimpleGrid>
                    <Field.Root>
                      <Field.Label>{t.booking_confirmation.address}</Field.Label>
                      <Textarea name="consignee_address" value={form.consignee_address} onChange={handleInputChange} readOnly={isReadOnly} rows={3} placeholder={t.booking_confirmation.address_placeholder} />
                    </Field.Root>
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
                  <Field.Label fontSize="sm">{t.booking_confirmation.origin_port} <Field.RequiredIndicator /></Field.Label>
                  <Select.Root disabled={isReadOnly} collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} width="100%">
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
                  <Field.Label fontSize="sm">{t.booking_confirmation.destination_port} <Field.RequiredIndicator /></Field.Label>
                  <Select.Root disabled={isReadOnly} collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} width="100%">
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
                  <Field.Label fontSize="sm">{t.booking_confirmation.incoterm}<Field.RequiredIndicator /></Field.Label>
                  <Select.Root disabled={isReadOnly} collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} width="100%">
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.booking_confirmation.incoterm_placeholder} />
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
                  <Input name="package_type" value={form.package_type} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.package_type_placeholder} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.total_packages}</Field.Label>
                  <Input type="number" name="total_packages" value={form.total_packages} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.total_packages_placeholder} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.gross_weight}</Field.Label>
                  <Input type="number" name="gross_weight" value={form.gross_weight} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.gross_weight_placeholder} />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.cbm}</Field.Label>
                  <Input type="number" name="cbm" value={form.cbm} onChange={handleInputChange} readOnly={isReadOnly} placeholder={t.booking_confirmation.cbm_placeholder} />
                </Field.Root>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>

          {/* Charges */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t.booking_confirmation.charges_summary}</Heading>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.freight_charge}</Field.Label>
                  <Input type="number" name="freight_charge" value={form.freight_charge} onChange={handleInputChange} readOnly={isReadOnly} placeholder="0" />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.local_charge}</Field.Label>
                  <Input type="number" name="local_charge" value={form.local_charge} onChange={handleInputChange} readOnly={isReadOnly} placeholder="0" />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">{t.booking_confirmation.other_charge}</Field.Label>
                  <Input type="number" name="other_charge" value={form.other_charge} onChange={handleInputChange} readOnly={isReadOnly} placeholder="0" />
                </Field.Root>
              </SimpleGrid>
              <Field.Root mt={4}>
                <Field.Label fontSize="sm">{t.booking_confirmation.remarks}</Field.Label>
                <Textarea name="remarks" value={form.remarks} onChange={handleInputChange} readOnly={isReadOnly} rows={3} placeholder={t.booking_confirmation.remarks_placeholder} />
              </Field.Root>

              {/* Action buttons */}
              <Flex justify="flex-end" mt={5}>
                {mode === "create" && (
                  <Flex gap={3}>
                    <Button variant="outline" color="#E77A1F" borderColor="#E77A1F" onClick={handleSave}>{t.booking_confirmation.save_draft}</Button>
                    <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.booking_confirmation.confirm_create_job}</Button>
                  </Flex>
                )}
              </Flex>

              {(bookingStatus === "draft" || bookingStatus === "cancelled") && (
                <Flex justify="flex-end" gap={3} mt={5}>
                  <Button variant="outline" onClick={handleUpdate}>{t.master.save}</Button>
                  <Button bg="#E77A1F" color="white" onClick={handleSubmitBooking}>{t.master.submit}</Button>
                </Flex>
              )}

              {bookingStatus === "submitted" && (
                <Flex gap={3} justifyContent="space-between" mt={5}>
                  <Button variant="outline">{t.master.export_pdf}</Button>
                  <Flex gap={6}>
                    <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>
                      {t.master.reject}
                    </Button>
                    <Button backgroundColor="green" onClick={handleApprove}>
                      {t.master.approve}
                    </Button>
                  </Flex>
                </Flex>
              )}
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

        {/* History log */}
        {mode === "view" && historyData.length > 0 && (
          <Card.Root mt={6}>
            <Card.Body>
              <Heading size="xl" mb={3}>History Log</Heading>
              {historyData.map((log, index) => (
                <Flex key={index} justify="space-between" mb={2}>
                  <Text fontSize="sm">
                    <b>{log.action}</b> by <b>{log.created_by}</b>
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString(
                          lang === "id" ? "id-ID" : "en-US",
                          { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
                        )
                      : "-"}
                  </Text>
                </Flex>
              ))}
            </Card.Body>
          </Card.Root>
        )}

      </SidebarWithHeader>

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
        lang={lang}
      />
    </>
  );
}

const jobTypeOptions = createListCollection({
  items: [
    { label: "Export", value: "export" },
    { label: "Import", value: "import" },
    { label: "Domestic", value: "domestic" },
  ],
});
