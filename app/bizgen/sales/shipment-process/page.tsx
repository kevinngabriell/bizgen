"use client";

import { Button, Card, createListCollection, Field, Flex, Heading, Icon, Input, Portal, Select, SimpleGrid, Tag, Text, Textarea,} from "@chakra-ui/react";
import { FiFileText, FiPackage, FiTruck } from "react-icons/fi";
import { Suspense, useEffect, useState } from "react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { getAllPort, GetPortData } from "@/lib/master/port";
import { createSalesDocument, generateSalesDocumentNumber } from "@/lib/sales/document";
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

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const shipmentID = searchParams.get("shipment_id");

  const [shipmentStatus, setShipmentStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  
  //set mode for create/update/view
  const [mode, setMode] = useState<ShipmentMode>("create");
  const isReadOnly = mode === "view" && shipmentStatus !== "draft" && shipmentStatus !== "rejected";
    
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

  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [jobOrderModalOpen, setJobOrderModalOpen] = useState(false);
  const [selectedJobOrder, setSelectedJobOrder] = useState<GetSalesBookingData | null>(null);

  const [linkedJobOrder, setLinkedJobOrder] = useState("");
  const [linkedJobOrderID, setLinkedJobOrderID] = useState("");
  
  // form state for input values
  const [form, setForm] = useState({
    shipment_no: "",
    booking_no: "",
    status: "",
    eta: "",
    etd: "",
    container_info: "",
    remarks: ""
  });

  // milestones state for each step
  const [milestones, setMilestones] = useState([
    { id: "cargo_pickup", label: `${t.sales_shipment_process.cargo_pickup}`, note: "", time: "" },
    { id: "stuffing", label: `${t.sales_shipment_process.stuffing}`, note: "", time: "" },
    { id: "customs_declaration", label: `${t.sales_shipment_process.customs_declaration}`, note: "", time: "" },
    { id: "port_in", label: `${t.sales_shipment_process.port_in}`, note: "", time: "" },
    { id: "on_board", label: `${t.sales_shipment_process.onboard}`, note: "", time: "" },
    { id: "arrival_port", label: `${t.sales_shipment_process.arrival_port}`, note: "", time: "" },
    { id: "delivery_to_consignee", label: `${t.sales_shipment_process.delivery}`, note: "", time: "" },
  ]);
    
  const portCollection = createListCollection({
    items: portOptions.map((port) => ({
      label: `${port.port_name} -  ${port.origin_name}`,
      value: port.port_id,
    })),
  });
  
  useEffect(() => {
    const loadMaster = async () => {
      try {
        setLoading(true);

        await init();

        const [shipViaRes, portRes, termRes] = await Promise.all([
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllTerm(1, 1000)
        ]);

        setShipmentTypeOptions(shipViaRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);

      } catch (err) {
        console.error(err);
      }
    }

    const loadDetail = async () => {
      if (!shipmentID) return;
    }

    const loadGeneratedNumber = async () => {
      if (shipmentID) return; 

      try {
        const res = await generateSalesDocumentNumber();
        setForm(prev => ({
          ...prev,
          shipment_no: res.number,
        }));
      } catch (err) {
        console.error("Failed to generate shipment no number", err);
      }
    }

    const loadAll = async () => {
      try {
        setLoading(true);
        await loadMaster();
        await loadDetail();
        await loadGeneratedNumber();
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [shipmentID]);

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

  const handleChooseJobOrder = async (job_order: GetSalesBookingData) => {
      try {
        setLoading(true);
        setSelectedJobOrder(job_order);
        setLinkedJobOrder(job_order.job_order_no);
        setLinkedJobOrderID(job_order.job_order_id);
      } catch (error) {
        console.error("Failed to bind inquiry items", error);
      } finally {
        setLoading(false);
        setJobOrderModalOpen(false);
      }
    };
  

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!form.shipment_no.trim())
        throw new Error(t.sales_shipment_process.error_1);
      if (!linkedJobOrderID)
        throw new Error(t.sales_shipment_process.error_2);
      if (!shipmentTypeSelected)
        throw new Error(t.sales_shipment_process.error_3);
      if (!termSelected)
        throw new Error(t.sales_shipment_process.error_4);
      if (!form.status)
        throw new Error(t.sales_shipment_process.error_5);
      if (!originSelected)
        throw new Error(t.sales_shipment_process.error_6);
      if (!destinationSelected)
        throw new Error(t.sales_shipment_process.error_7);
      if (originSelected === destinationSelected)
        throw new Error(t.sales_shipment_process.error_8);
      if (!form.etd)
        throw new Error(t.sales_shipment_process.error_9);
      if (!form.eta)
        throw new Error(t.sales_shipment_process.error_10);
      if (new Date(form.eta) < new Date(form.etd))
        throw new Error(t.sales_shipment_process.error_11);

      // Validate milestones (optional but if time exists, must be valid)
      for (const milestone of milestones) {
        if (milestone.time) {
          const date = new Date(milestone.time);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid milestone time for ${milestone.label}`);
          }
        }
      }

      setLoading(true);

      const payload = {
        shipment_no: form.shipment_no,
        job_order_id: linkedJobOrderID,
        ship_via_id: shipmentTypeSelected,
        term_id: termSelected,
        origin_port: originSelected,
        destination_port: destinationSelected,
        etd: form.etd,
        eta: form.eta,
        container_information: form.container_info,
        operational_notes: form.remarks,
        milestones: milestones.map((row) => ({
          type: row.id,
          date: row.time,
          note: row.note,
        }))
      }
      
      const res = await createSalesDocument(payload);

      // If validation passed
      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_shipment_process.success_msg);

      // reset form values
      setForm({shipment_no: "", booking_no: "", status: "", eta: "", etd: "", container_info: "", remarks: ""});
      setShipmentTypeSelected(undefined);
      setTermSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setLinkedJobOrder("");
      setLinkedJobOrderID("");

      // reset milestones
      setMilestones([
        { id: "cargo_pickup", label: `${t.sales_shipment_process.cargo_pickup}`, note: "", time: "" },
        { id: "stuffing", label: `${t.sales_shipment_process.stuffing}`, note: "", time: "" },
        { id: "customs_declaration", label: `${t.sales_shipment_process.customs_declaration}`, note: "", time: "" },
        { id: "port_in", label: `${t.sales_shipment_process.port_in}`, note: "", time: "" },
        { id: "on_board", label: `${t.sales_shipment_process.onboard}`, note: "", time: "" },
        { id: "arrival_port", label: `${t.sales_shipment_process.arrival_port}`, note: "", time: "" },
        { id: "delivery_to_consignee", label: `${t.sales_shipment_process.delivery}`, note: "", time: "" },
      ]);

      setTimeout(() => setShowAlert(false), 6000);

    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_shipment_process.error_msg);
    } finally {
      setLoading(false);
      setTimeout(() => setShowAlert(false), 6000);
    }
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
              <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={handleSave}>{t.sales_shipment_process.save_draft}</Button>
              <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.sales_shipment_process.save_continue}</Button>
            </>
          )}
        </Flex>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}
      <SalesBookingLookup isOpen={jobOrderModalOpen} onClose={() => setJobOrderModalOpen(false)} onChoose={handleChooseJobOrder}/>

      <Card.Root>
        <Card.Header>
          <Flex gap={4} alignItems={"center"}>
            <Icon as={FiTruck}/>
            <Heading fontSize={"md"}>{t.sales_shipment_process.shipment_overview}</Heading>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.shipment_number}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_shipment_process.shipment_number_placeholder} value={form.shipment_no} onChange={(e) => setForm({ ...form, shipment_no: e.target.value })}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.job_booking_no}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_shipment_process.job_booking_no_placeholder} value={linkedJobOrder} readOnly cursor="pointer" onClick={() => setJobOrderModalOpen(true)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.shipment_type}<Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []} onValueChange={(details) => setShipmentTypeSelected(details.value[0])}>
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
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.incoterm}<Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} width="100%">
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
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.shipment_status} <Field.RequiredIndicator/></Field.Label>
                <Select.Root collection={statusOptions} value={form.status ? [form.status] : []} onValueChange={(details) => setForm({ ...form, status: details.value[0] })}>
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
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.port_loading} <Field.RequiredIndicator/></Field.Label>
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
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.port_discharge} <Field.RequiredIndicator/></Field.Label>
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
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.eta} <Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_shipment_process.etd} <Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.container_info}</Field.Label>
              <Textarea placeholder={t.sales_shipment_process.container_info_placeholder} value={form.container_info} onChange={(e) => setForm({ ...form, container_info: e.target.value })}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_shipment_process.remarks}</Field.Label>
              <Textarea placeholder={t.sales_shipment_process.remarks_placeholder} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}/>
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
          {milestones.map((item, index) => (
            <SimpleGrid key={item.label} templateColumns={{ base: "1fr", md: "260px 1fr 200px" }} gap={3} alignItems="center" mb={4}>
              <Text>{item.label}</Text>
              <Textarea placeholder={t.sales_shipment_process.notes_optional} value={item.note}
                onChange={(e) => {
                  const updated = [...milestones]; 
                  updated[index].note = e.target.value;
                  setMilestones(updated);
                }}
              />
              <Input type="datetime-local" value={item.time}
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
    { label: "Ready for Pickup", value: "ready_for_pickup" },
    { label: "Port In", value: "port_in" },
    { label: "On Board", value: "on_board" },
    { label: "Arrived", value: "arrived" },
    { label: "Delivered", value: "delivered" }
  ],
})