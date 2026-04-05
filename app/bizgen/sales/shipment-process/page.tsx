"use client";

import {
  Badge, Button, Card, createListCollection, Field, Flex, Heading,
  Icon, Input, Portal, Select, SimpleGrid, Tag, Text, Textarea,
} from "@chakra-ui/react";
import { FiFileText, FiPackage, FiTruck } from "react-icons/fi";
import { Suspense, useEffect, useState } from "react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import RejectDialog from "@/components/dialog/RejectDialog";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/loading";
import { SALES_APPROVAL_ROLES, SALES_CREATE_ROLES, DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { getAllPort, GetPortData } from "@/lib/master/port";
import {
  createSalesDocument, generateSalesDocumentNumber, getDetailSalesDocument,
  updateSalesDocument, processShipmentAction, GetDetailShipmentHistory,
} from "@/lib/sales/document";
import { AlertMessage } from "@/components/ui/alert";
import SalesBookingLookup from "@/components/lookup/SalesJoborderLookup";
import { GetSalesBookingData } from "@/lib/sales/booking-confirmation";

type ShipmentMode = "create" | "view" | "edit";

export default function ShipmentProcessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ShipmentProcessContent />
    </Suspense>
  );
}

function ShipmentProcessContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? "");
  const canCreate = SALES_CREATE_ROLES.has(auth?.app_role_id ?? "");

  const searchParams = useSearchParams();
  const shipmentID = searchParams.get("shipment_id");

  const [shipmentDetailId, setShipmentDetailId] = useState<string>();
  const [shipmentStatus, setShipmentStatus] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [historyData, setHistoryData] = useState<GetDetailShipmentHistory[]>([]);

  const [mode, setMode] = useState<ShipmentMode>("create");
  const isReadOnly = mode === "view" && shipmentStatus !== "draft" && shipmentStatus !== "cancelled";

  // reject dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // ship via
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
    })),
  });

  // term
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);

  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
      label: `${term.term_name}`,
      value: term.term_id,
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

  // job order lookup
  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<GetSalesBookingData | null>(null);
  const [linkedJobOrder, setLinkedJobOrder] = useState("");
  const [linkedJobOrderID, setLinkedJobOrderID] = useState("");

  const [form, setForm] = useState({
    shipment_no: "",
    booking_no: "",
    status: "",
    eta: "",
    etd: "",
    container_info: "",
    remarks: "",
  });

  const [milestones, setMilestones] = useState([
    { id: "cargo_pickup",          label: "", note: "", time: "" },
    { id: "stuffing",              label: "", note: "", time: "" },
    { id: "customs_declaration",   label: "", note: "", time: "" },
    { id: "port_in",               label: "", note: "", time: "" },
    { id: "on_board",              label: "", note: "", time: "" },
    { id: "arrival_port",          label: "", note: "", time: "" },
    { id: "delivery_to_consignee", label: "", note: "", time: "" },
  ]);

  // helper to build milestones with current translations
  const buildMilestones = (overrides: { id: string; note: string; time: string }[] = []) => {
    const labels: Record<string, string> = {
      cargo_pickup:          t.sales_shipment_process.cargo_pickup,
      stuffing:              t.sales_shipment_process.stuffing,
      customs_declaration:   t.sales_shipment_process.customs_declaration,
      port_in:               t.sales_shipment_process.port_in,
      on_board:              t.sales_shipment_process.onboard,
      arrival_port:          t.sales_shipment_process.arrival_port,
      delivery_to_consignee: t.sales_shipment_process.delivery,
    };
    return Object.keys(labels).map((id) => {
      const override = overrides.find((o) => o.id === id);
      return { id, label: labels[id], note: override?.note ?? "", time: override?.time ?? "" };
    });
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
        const portData    = portRes?.data   ?? [];
        const termData    = termRes?.data   ?? [];

        setShipmentTypeOptions(shipViaData);
        setPortOptions(portData);
        setTermOptions(termData);

        if (shipmentID) {
          setMode("view");
          const res = await getDetailSalesDocument(shipmentID);

          setShipmentDetailId(res.header.shipment_id);
          setShipmentStatus(res.header.status);
          setLinkedJobOrder(res.header.job_order_no ?? "");
          setLastUpdatedAt(res.header.updated_at ?? res.header.created_at);
          setLastUpdatedBy(res.header.updated_by ?? res.header.created_by);

          // match IDs by name
          const matchedShipVia = shipViaData.find(sv => sv.ship_via_name === res.header.ship_via_name);
          if (matchedShipVia) setShipmentTypeSelected(matchedShipVia.ship_via_id);

          const matchedTerm = termData.find(tm => tm.term_name === res.header.term_name);
          if (matchedTerm) setTermSelected(matchedTerm.term_id);

          // populate route (first route)
          const route = res.routes?.[0];
          if (route) {
            const matchedOrigin = portData.find(p => p.port_name === route.origin_port_name);
            if (matchedOrigin) setOriginSelected(matchedOrigin.port_id);

            const matchedDest = portData.find(p => p.port_name === route.destination_port_name);
            if (matchedDest) setDestinationSelected(matchedDest.port_id);

            setForm(prev => ({
              ...prev,
              shipment_no:    res.header.shipment_no,
              etd:            route.etd            ?? "",
              eta:            route.eta            ?? "",
              container_info: route.container_information ?? "",
              remarks:        route.operational_notes     ?? "",
            }));
          } else {
            setForm(prev => ({ ...prev, shipment_no: res.header.shipment_no }));
          }

          // populate milestones from detail
          const milestoneOverrides = (res.milestones ?? []).map(m => ({
            id:   m.milestone_type,
            note: m.notes          ?? "",
            time: m.milestone_date ?? "",
          }));
          setMilestones(buildMilestones(milestoneOverrides));

          setHistoryData(res.history ?? []);
        } else {
          // create mode — generate number & init milestone labels
          const res = await generateSalesDocumentNumber();
          setForm(prev => ({ ...prev, shipment_no: res.number }));
          setMilestones(buildMilestones());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [shipmentID]);

  const handleChooseJobOrder = async (job_order: GetSalesBookingData) => {
    try {
      setLoading(true);
      setSelectedJobOrder(job_order);
      setLinkedJobOrder(job_order.job_order_no);
      setLinkedJobOrderID(job_order.job_order_id);
    } catch (error) {
      console.error("Failed to bind job order", error);
    } finally {
      setLoading(false);
      setJobOrderModalOpen(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.shipment_no.trim())       throw new Error(t.sales_shipment_process.error_1);
      if (!linkedJobOrderID)              throw new Error(t.sales_shipment_process.error_2);
      if (!shipmentTypeSelected)          throw new Error(t.sales_shipment_process.error_3);
      if (!termSelected)                  throw new Error(t.sales_shipment_process.error_4);
      if (!form.status)                   throw new Error(t.sales_shipment_process.error_5);
      if (!originSelected)                throw new Error(t.sales_shipment_process.error_6);
      if (!destinationSelected)           throw new Error(t.sales_shipment_process.error_7);
      if (originSelected === destinationSelected) throw new Error(t.sales_shipment_process.error_8);
      if (!form.etd)                      throw new Error(t.sales_shipment_process.error_9);
      if (!form.eta)                      throw new Error(t.sales_shipment_process.error_10);
      if (new Date(form.eta) < new Date(form.etd)) throw new Error(t.sales_shipment_process.error_11);

      for (const milestone of milestones) {
        if (milestone.time && isNaN(new Date(milestone.time).getTime()))
          throw new Error(`Invalid milestone time for ${milestone.label}`);
      }

      setLoading(true);

      await createSalesDocument({
        shipment_no:           form.shipment_no,
        job_order_id:          linkedJobOrderID,
        ship_via_id:           shipmentTypeSelected,
        term_id:               termSelected,
        origin_port:           originSelected,
        destination_port:      destinationSelected,
        etd:                   form.etd,
        eta:                   form.eta,
        container_information: form.container_info,
        operational_notes:     form.remarks,
        milestones: milestones.map((row) => ({ type: row.id, date: row.time, note: row.note })),
      });

      showSuccess(t.sales_shipment_process.success_msg);

      setForm({ shipment_no: "", booking_no: "", status: "", eta: "", etd: "", container_info: "", remarks: "" });
      setShipmentTypeSelected(undefined);
      setTermSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setLinkedJobOrder("");
      setLinkedJobOrderID("");
      setMilestones(buildMilestones());
    } catch (err: any) {
      showError(err.message || t.sales_shipment_process.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!shipmentDetailId) throw new Error("Shipment ID not found");
      setLoading(true);

      await updateSalesDocument({
        shipment_id: shipmentDetailId,
        ship_via_id: shipmentTypeSelected,
        term_id:     termSelected,
      });

      showSuccess("Shipment updated successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to update shipment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitShipment = async () => {
    try {
      if (!shipmentDetailId) throw new Error("Shipment ID not found");
      setLoading(true);

      await processShipmentAction({ shipment_id: shipmentDetailId, action: "submit" });

      setShipmentStatus("submitted");
      showSuccess("Shipment submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit shipment.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!shipmentDetailId) throw new Error("Shipment ID not found");
      setLoading(true);

      await processShipmentAction({ shipment_id: shipmentDetailId, action: "approve" });

      setShipmentStatus("confirmed");
      showSuccess("Shipment approved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to approve shipment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!shipmentDetailId) throw new Error("Shipment ID not found");
      setRejectLoading(true);

      await processShipmentAction({ shipment_id: shipmentDetailId, action: "reject", notes: reason });

      setIsRejectDialogOpen(false);
      setShipmentStatus("cancelled");
      showSuccess("Shipment rejected successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to reject shipment.");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>

        <SalesBookingLookup isOpen={jobOrderModalOpen} onClose={() => setJobOrderModalOpen(false)} onChoose={handleChooseJobOrder} />

        <Flex direction="column">
          <Flex flexDir="column">
            <Heading size="lg">{t.sales_shipment_process.title}</Heading>
            <Text color="gray.600" mb={4} fontSize="sm">{t.sales_shipment_process.description}</Text>
          </Flex>

          {mode === "view" && (
            <Card.Root mb={4}>
              <Card.Body>
                <Flex justifyContent="space-between">
                  <Badge
                    variant="solid"
                    colorPalette={
                      shipmentStatus === "confirmed" ? "green"
                      : shipmentStatus === "cancelled" ? "red"
                      : shipmentStatus === "submitted" ? "blue"
                      : "yellow"
                    }
                  >
                    {shipmentStatus ? shipmentStatus.charAt(0).toUpperCase() + shipmentStatus.slice(1) : "Draft"}
                  </Badge>
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

        {/* Shipment Overview */}
        <Card.Root>
          <Card.Header>
            <Flex gap={4} alignItems="center">
              <Icon as={FiTruck} />
              <Heading fontSize="md">{t.sales_shipment_process.shipment_overview}</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.shipment_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_shipment_process.shipment_number_placeholder}
                  value={form.shipment_no}
                  readOnly={isReadOnly}
                  onChange={(e) => setForm({ ...form, shipment_no: e.target.value })}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.job_booking_no}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_shipment_process.job_booking_no_placeholder}
                  value={linkedJobOrder}
                  readOnly
                  cursor={isReadOnly ? "default" : "pointer"}
                  onClick={() => !isReadOnly && setJobOrderModalOpen(true)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.shipment_type}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={shipmentTypeCollection}
                  value={shipmentTypeSelected ? [shipmentTypeSelected] : []}
                  onValueChange={(details) => setShipmentTypeSelected(details.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.shipment_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentTypeCollection.items.map((s) => (
                          <Select.Item item={s} key={s.value}>{s.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.incoterm}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={termCollection}
                  value={termSelected ? [termSelected] : []}
                  onValueChange={(details) => setTermSelected(details.value[0])}
                  width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.incoterm_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
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
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.shipment_status}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={statusOptions}
                  value={form.status ? [form.status] : []}
                  onValueChange={(details) => setForm({ ...form, status: details.value[0] })}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.shipment_status_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {statusOptions.items.map((status) => (
                          <Select.Item item={status} key={status.value}>
                            {status.label}<Select.ItemIndicator />
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

        {/* Routing & Container */}
        <Card.Root mt={5}>
          <Card.Header>
            <Flex gap={4} alignItems="center">
              <Icon as={FiPackage} />
              <Heading fontSize="md">{t.sales_shipment_process.routing_container}</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.port_loading}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={portCollection}
                  value={originSelected ? [originSelected] : []}
                  onValueChange={(details) => setOriginSelected(details.value[0])}
                  size="sm" width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.port_loading_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
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
                <Field.Label>{t.sales_shipment_process.port_discharge}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  disabled={isReadOnly}
                  collection={portCollection}
                  value={destinationSelected ? [destinationSelected] : []}
                  onValueChange={(details) => setDestinationSelected(details.value[0])}
                  size="sm" width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_shipment_process.port_discharge_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
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
                <Field.Label>{t.sales_shipment_process.eta}<Field.RequiredIndicator /></Field.Label>
                <Input type="date" value={form.eta} readOnly={isReadOnly} onChange={(e) => setForm({ ...form, eta: e.target.value })} />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_shipment_process.etd}<Field.RequiredIndicator /></Field.Label>
                <Input type="date" value={form.etd} readOnly={isReadOnly} onChange={(e) => setForm({ ...form, etd: e.target.value })} />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_shipment_process.container_info}</Field.Label>
                <Textarea placeholder={t.sales_shipment_process.container_info_placeholder} value={form.container_info} readOnly={isReadOnly} onChange={(e) => setForm({ ...form, container_info: e.target.value })} />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_shipment_process.remarks}</Field.Label>
                <Textarea placeholder={t.sales_shipment_process.remarks_placeholder} value={form.remarks} readOnly={isReadOnly} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Milestones */}
        <Card.Root mt={5}>
          <Card.Header>
            <Flex gap={4} alignItems="center">
              <Icon as={FiTruck} />
              <Heading fontSize="md">{t.sales_shipment_process.milestones}</Heading>
            </Flex>
          </Card.Header>
          <Card.Body>
            {milestones.map((item, index) => (
              <SimpleGrid key={item.id} templateColumns={{ base: "1fr", md: "260px 1fr 200px" }} gap={3} alignItems="center" mb={4}>
                <Text>{item.label}</Text>
                <Textarea
                  placeholder={t.sales_shipment_process.notes_optional}
                  value={item.note}
                  readOnly={isReadOnly}
                  onChange={(e) => {
                    const updated = [...milestones];
                    updated[index].note = e.target.value;
                    setMilestones(updated);
                  }}
                />
                <Input
                  type="datetime-local"
                  value={item.time}
                  readOnly={isReadOnly}
                  onChange={(e) => {
                    const updated = [...milestones];
                    updated[index].time = e.target.value;
                    setMilestones(updated);
                  }}
                />
              </SimpleGrid>
            ))}
          </Card.Body>
        </Card.Root>

        {/* Documents */}
        <Card.Root mt={5}>
          <Card.Header>
            <Flex gap={4} alignItems="center">
              <Icon as={FiFileText} />
              <Heading fontSize="md">{t.sales_shipment_process.shipment_documents}</Heading>
            </Flex>
            <Text color="gray.600" fontSize="sm">{t.sales_shipment_process.shipment_documents_desc}</Text>
          </Card.Header>
          <Card.Body>
            <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
              {[
                t.sales_shipment_process.commercial_invoice,
                t.sales_shipment_process.packing_list,
                t.sales_shipment_process.bill_of_lading,
                t.sales_shipment_process.coo,
                t.sales_shipment_process.insurance_document,
                t.sales_shipment_process.customs_document,
                t.sales_shipment_process.gate_pass,
                t.sales_shipment_process.supporting_docs,
              ].map((doc) => (
                <Card.Root key={doc} variant="outline">
                  <Card.Body>
                    <Field.Root>
                      <Field.Label>{doc}</Field.Label>
                      <Tag.Root>
                        <Tag.Label>{t.sales_shipment_process.optional}</Tag.Label>
                      </Tag.Root>
                      <Button size="sm" bg="#E77A1F" color="white" cursor="pointer">
                        {t.sales_shipment_process.view_replace}
                      </Button>
                    </Field.Root>
                  </Card.Body>
                </Card.Root>
              ))}
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Action buttons */}
        <Flex justify="flex-end" mt={6}>
          {mode === "create" && canCreate && (
            <Flex gap={3}>
              <Button variant="outline" bg="transparent" borderColor="#E77A1F" color="#E77A1F" onClick={handleSave}>
                {t.sales_shipment_process.save_draft}
              </Button>
              <Button bg="#E77A1F" color="white" onClick={handleSave}>
                {t.sales_shipment_process.save_continue}
              </Button>
            </Flex>
          )}
        </Flex>

        {(shipmentStatus === "draft" || shipmentStatus === "cancelled") && (
          <Flex justify="flex-end" gap={3} mt={6}>
            <Button variant="outline" onClick={handleUpdate}>{t.master.save}</Button>
            <Button bg="#E77A1F" color="white" onClick={handleSubmitShipment}>{t.master.submit}</Button>
          </Flex>
        )}

        {shipmentStatus === "submitted" && (
          <Flex gap={3} justifyContent="space-between" mt={6}>
            <Button variant="outline">{t.master.export_pdf}</Button>
            <Flex gap={6}>
              {canApprove && <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>{t.master.reject}</Button>}
              {canApprove && <Button backgroundColor="green" onClick={handleApprove}>{t.master.approve}</Button>}
            </Flex>
          </Flex>
        )}

        {/* History log */}
        {mode === "view" && historyData.length > 0 && (
          <Card.Root mt={6}>
            <Card.Body>
              <Heading size="xl" mb={3}>History Log</Heading>
              {historyData.map((log, index) => (
                <Flex key={index} justify="space-between" mb={2}>
                  <Text fontSize="sm">
                    {log.notes} by <b>{log.action_by}</b>
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

const statusOptions = createListCollection({
  items: [
    { label: "Pending",          value: "pending" },
    { label: "Ready for Pickup", value: "ready_for_pickup" },
    { label: "Port In",          value: "port_in" },
    { label: "On Board",         value: "on_board" },
    { label: "Arrived",          value: "arrived" },
    { label: "Delivered",        value: "delivered" },
  ],
});
