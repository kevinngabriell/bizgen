"use client";

import { Suspense, useEffect, useState } from "react";
import { Button, Flex, Input, Textarea, Heading, Badge, Field, Card, Text, Table, IconButton, SimpleGrid, createListCollection, Select, Portal } from "@chakra-ui/react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { FaTrash } from "react-icons/fa";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { useSearchParams } from "next/navigation";
import { getLang } from "@/lib/i18n";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { getAllOrigin, GetOriginData } from "@/lib/master/origin";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import { createSalesRfq, generateRfqNumber, GetDetailRfqHistory, getDetailSalesRfq } from "@/lib/sales/rfq";
import { AlertMessage } from "@/components/ui/alert";
import { InfoTip } from "@/components/ui/toggle-tip";
import { getAllCommodity, GetCommodityData } from "@/lib/master/commodity";

type InquiryMode = "create" | "view" | "edit";

export default function Inquiry() {
  return (
    <Suspense fallback={<Loading />}>
      <InquiryContent />
    </Suspense>
  );
}

function InquiryContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const rfqId = searchParams.get("rfq_id");

  const [rfqStatus, setRfqStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  //set mode for create/update/view
  const [mode, setMode] = useState<InquiryMode>("create");
  const isReadOnly = mode === "view" && rfqStatus !== "draft" && rfqStatus !== "rejected";
  
  //set shipment type selection
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
  const [countryOptions, setCountryOptions] = useState<GetOriginData[]>([]);
  
  const countryCollection = createListCollection({
    items: countryOptions.map((origin) => ({
      label: `${origin.origin_name}`,
      value: origin.origin_id,
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

  //set uom selection
  const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);
  
  const uomCollection = createListCollection({
    items: uomOptions.map((uom) => ({
      label: `${uom.uom_name}`,
      value: uom.uom_id,
    })),
  });

  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [historyData, setHistoryData] = useState<GetDetailRfqHistory[]>([]);

  //set commodity type selection
  const [commoditySelected, setCommoditySelected] = useState<string>();
  const [commodityOptions, setCommodityOptions] = useState<GetCommodityData[]>([]);
  
  const commodityCollection = createListCollection({
    items: commodityOptions.map((commodity) => ({
      label: `${commodity.commodity_code} - ${commodity.commodity_name}`,
      value: commodity.commodity_id,
    })),
  });

  useEffect(() => {
  const loadMaster = async () => {
    try {
      setLoading(true);

      await init();

      const [
        shipmentTypeRes,
        countryRes,
        termRes,
        uomRes,
        commodityRes,
      ] = await Promise.all([
        getAllShipVia(1, 1000),
        getAllOrigin(1, 1000),
        getAllTerm(1, 1000),
        getAllUOM(1, 1000),
        getAllCommodity(1, 1000),
      ]);

      setShipmentTypeOptions(shipmentTypeRes?.data ?? []);
      setCountryOptions(countryRes?.data ?? []);
      setTermOptions(termRes?.data ?? []);
      setUOMOptions(uomRes?.data ?? []);
      setCommodityOptions(commodityRes?.data ?? []);

    } catch (err) {
      console.error(err);
    }
  };

  const loadDetail = async () => {
    if (!rfqId) return;

    try {
      setMode("view");

      const res = await getDetailSalesRfq(rfqId);

      setForm({
        inquiryNo: res.header.sales_rfq_number,
        customerName: res.header.customer_name,
        contactPerson: res.header.pic_customer_name,
        customerPhone: res.header.phone_whatsapp,
        originCountry: res.header.origin_id,
        destinationCountry: res.header.destination_id,
        commodity: res.header.commodity_id,
        incoterm: res.header.incoterm_id,
        shipmentType: res.header.ship_via_id,
        remarks: res.header.remarks || "",
      });

      setRfqStatus(res.header.rfq_status);
      setLastUpdatedAt(res.header.updated_at);
      // setLastUpdatedBy(res.header.updated_by_name);

      setShipmentTypeSelected(res.header.ship_via_id);
      setOriginSelected(res.header.origin_id);
      setDestinationSelected(res.header.destination_id);
      setTermSelected(res.header.incoterm_id);
      setCommoditySelected(res.header.commodity_id);

      setItems(
        res.items.map((item: any) => ({
          name: item.item_name,
          hsCode: item.hs_code || "",
          qty: String(item.quantity),
          unit: String(item.uom_id),
          weight: item.weight_kg ? String(item.weight_kg) : "",
          cbm: item.cbm ? String(item.cbm) : "",
          packaging: item.packaging || "",
        }))
      );

      setHistoryData(
        res.history.map((history: any) => ({
          action: history.action,
          action_by: history.action_by,
          action_at: history.action_at,
          notes: history.notes
        }))
      );

    } catch (err) {
      console.error(err);
    }
  };

  const loadGeneratedNumber = async () => {
    if (rfqId) return; // kalau ada rfqId, jangan generate (view/edit mode)

    try {
      const res = await generateRfqNumber();
      setForm(prev => ({
        ...prev,
        inquiryNo: res.number,
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

}, [rfqId]);

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
    
  // Inquiry data
  const [form, setForm] = useState({
    inquiryNo: "",
    customerName: "",
    contactPerson: "",
    customerPhone: "",
    originCountry: "",
    destinationCountry: "",
    commodity: "",
    incoterm: "",
    shipmentType: "",
    remarks: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const [items, setItems] = useState([
    { name: "", hsCode: "", qty: "", unit: "", weight: "", cbm: "", packaging: "" }
  ]);

  const addItemRow = () => {
    setItems([
      ...items,
      { name: "", hsCode: "", qty: "", unit: "", weight: "", cbm: "", packaging: "" }
    ]);
  };

  const removeItemRow = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const updateItemField = (index: number, field: string, value: string) => {
    const next = [...items];
    // @ts-ignore
    next[index][field] = value;
    setItems(next);
  };

  const handleSave = async () => {
    try {
      // 🔎 Basic validation
      if (!form.inquiryNo) 
        throw new Error(t.sales_inquiry.error_1);
      if (!form.customerName) 
        throw new Error(t.sales_inquiry.error_2);
      if (!shipmentTypeSelected) 
        throw new Error(t.sales_inquiry.error_3);
      if (!originSelected) 
        throw new Error(t.sales_inquiry.error_4);
      if (!destinationSelected) 
        throw new Error(t.sales_inquiry.error_5);
      if (!termSelected) 
        throw new Error(t.sales_inquiry.error_6);
      if (!commoditySelected) 
        throw new Error(t.sales_inquiry.error_7);
      if (items.length === 0) 
        throw new Error(t.sales_inquiry.error_8);

      setLoading(true);

      const payload = {
        sales_rfq_number: form.inquiryNo,
        customer_name: form.customerName, 
        pic_customer_name: form.contactPerson,
        phone_whatsapp: form.customerPhone,
        ship_via_id: shipmentTypeSelected,
        origin_id: originSelected,
        destination_id: destinationSelected,
        incoterm_id: termSelected,
        commodity_id: commoditySelected as string, 
        remarks: form.remarks || undefined,
        items: items.map((row) => ({
          item_name: row.name,
          uom_id: row.unit,
          quantity: Number(row.qty),
          hs_code: row.hsCode || undefined,
          weight_kg: row.weight ? Number(row.weight) : undefined,
          cbm: row.cbm ? Number(row.cbm) : undefined,
          packaging: row.packaging || undefined,
        })),
      };

      const res = await createSalesRfq(payload);

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_inquiry.success_msg);
      setTimeout(() => setShowAlert(false), 6000);

      setForm({inquiryNo: "", customerName: "", contactPerson: "", customerPhone: "", originCountry: "", destinationCountry: "", commodity: "", incoterm: "", shipmentType: "", remarks: ""});
      setItems([{ name: "", hsCode: "", qty: "", unit: "", weight: "", cbm: "", packaging: "" }]);
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setTermSelected(undefined);
      setCommoditySelected(undefined);

    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_inquiry.error_msg);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };
    
  //set loading process
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      
      <Flex direction="column">
        <Heading size="xl">{mode === "create" && t.sales_inquiry.title_create}
          {mode === "view" && t.sales_inquiry.title_view}
          {mode === "edit" && t.sales_inquiry.title_edit}
        </Heading>

        {mode === "view" && (
          <Card.Root mt={3}>
            <Card.Body>
              <Flex justifyContent={"space-between"}>
                <Badge variant={"solid"} colorPalette={ rfqStatus === "APPROVED"  ? "green" : rfqStatus === "REJECTED" ? "red" : "yellow"}>
                  {rfqStatus}
                </Badge>
                <Text fontSize="xs" color="gray.600">
                  {t.master.last_update_by} <b>{lastUpdatedBy || "System"}</b> • {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{base: 1 ,md: 2}} gap={6}>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.inquiry_no} <Field.RequiredIndicator/></Field.Label>
                <Input name="inquiryNo" value={form.inquiryNo} onChange={handleChange} readOnly={isReadOnly} placeholder={t.sales_inquiry.inquiry_no_placeholder}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.customer_name}<Field.RequiredIndicator/> <InfoTip content={t.sales_inquiry.hint_1}/> </Field.Label>
                <Input name="customerName" value={form.customerName} placeholder={t.sales_inquiry.customer_placeholder} readOnly={isReadOnly}  onChange={handleChange} />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.contact_person} <Field.RequiredIndicator/></Field.Label>
                <Input name="contactPerson" value={form.contactPerson} placeholder={t.sales_inquiry.contact_person_placeholder} onChange={handleChange} readOnly={isReadOnly}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.phone}<Field.RequiredIndicator/> <InfoTip content={t.sales_inquiry.hint_2} /></Field.Label>
                <Input name="customerPhone" value={form.customerPhone} placeholder={t.sales_inquiry.phone_placeholder} onChange={handleChange} readOnly={isReadOnly}/>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.shipment_type} <Field.RequiredIndicator/> </Field.Label>
                <Select.Root disabled={isReadOnly} collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []} onValueChange={(details) => setShipmentTypeSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_inquiry.shipment_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentTypeCollection.items.map((shipment) => (
                          <Select.Item item={shipment} key={shipment.value}>{shipment.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.origin_country} <Field.RequiredIndicator/></Field.Label>
                <Select.Root disabled={isReadOnly} collection={countryCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.sales_inquiry.origin_country_placeholder} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {countryCollection.items.map((country) => (
                          <Select.Item item={country} key={country.value}>{country.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
              </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.destination_country} <Field.RequiredIndicator/></Field.Label>
                <Select.Root disabled={isReadOnly} collection={countryCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_inquiry.destination_country_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {countryCollection.items.map((country) => (
                          <Select.Item item={country} key={country.value}>{country.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.commodity} <Field.RequiredIndicator/></Field.Label>
                <Select.Root disabled={isReadOnly} collection={commodityCollection} value={commoditySelected ? [commoditySelected] : []} onValueChange={(details) => setCommoditySelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_inquiry.shipment_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {commodityCollection.items.map((commodity) => (
                          <Select.Item item={commodity} key={commodity.value}>{commodity.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_inquiry.incoterm} <Field.RequiredIndicator/></Field.Label>
                <Select.Root disabled={isReadOnly} collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_inquiry.incoterm_placeholder} />
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
                <Field.Label>{t.sales_inquiry.remarks}</Field.Label>
                <Textarea name="remarks" value={form.remarks} onChange={handleChange} readOnly={isReadOnly} placeholder={t.sales_inquiry.remarks_placeholder}/>
              </Field.Root>
            </SimpleGrid>
            
            {/* Inquiry Item Section */}
            <Card.Root mt={6}>
              <Card.Body>
                <Flex justify="space-between" align="center" mb="3">
                  <Heading size="md">{t.sales_inquiry.item_list_title}</Heading>
                  {!isReadOnly && (
                    <Button size="sm" bg="#E77A1F" color="white" onClick={addItemRow}>{t.sales_inquiry.add_item}</Button>
                  )}
                </Flex>

                <Text fontSize="sm" color="gray.600" mb="3">{t.sales_inquiry.item_list_description}</Text>

                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{t.sales_inquiry.item_name}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.sales_inquiry.hs_code}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.sales_inquiry.qty}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.sales_inquiry.unit}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.sales_inquiry.weight}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.sales_inquiry.cbm}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t.sales_inquiry.packaging}</Table.ColumnHeader>
                      <Table.ColumnHeader></Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {items.map((row, index) => (
                      <Table.Row  key={index}>
                        <Table.Cell>
                          <Input value={row.name} readOnly={isReadOnly}  placeholder={t.sales_inquiry.item_name_placeholder} onChange={(e) => updateItemField(index, "name", e.target.value)}/>
                        </Table.Cell>
                        <Table.Cell>
                          <Input value={row.hsCode} readOnly={isReadOnly}  placeholder={t.sales_inquiry.hs_code_placeholder} onChange={(e) => updateItemField(index, "hsCode", e.target.value)}/>
                        </Table.Cell>
                        <Table.Cell>
                          <Input type="number" value={row.qty} readOnly={isReadOnly}  placeholder={t.sales_inquiry.qty} onChange={(e) => updateItemField(index, "qty", e.target.value)}/>
                        </Table.Cell>
                        <Table.Cell>
                          <Select.Root disabled={isReadOnly} collection={uomCollection} 
                            value={row.unit && uomCollection.items.some(i => i.value === row.unit) ? [row.unit] : []} 
                            onValueChange={(details) => updateItemField(index, "unit", details.value?.[0] ?? "")} width="100%">
                            <Select.HiddenSelect />
                            <Select.Control>
                              <Select.Trigger>
                                <Select.ValueText placeholder={t.sales_inquiry.unit_placeholder} />
                              </Select.Trigger>
                              <Select.IndicatorGroup>
                                <Select.Indicator />
                              </Select.IndicatorGroup>
                            </Select.Control>
                            <Portal>
                              <Select.Positioner>
                                <Select.Content>
                                  {uomCollection.items.map((uom) => (
                                    <Select.Item item={uom} key={uom.value}>{uom.label}<Select.ItemIndicator /></Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Positioner>
                            </Portal>
                          </Select.Root>
                        </Table.Cell>
                        <Table.Cell>
                          <Input type="number" value={row.weight} readOnly={isReadOnly}  placeholder={t.sales_inquiry.weight_placeholder} onChange={(e) => updateItemField(index, "weight", e.target.value)}/>
                        </Table.Cell>
                        <Table.Cell>
                          <Input type="number" value={row.cbm} readOnly={isReadOnly}  placeholder={t.sales_inquiry.cbm_placeholder} onChange={(e) => updateItemField(index, "cbm", e.target.value)}/>
                        </Table.Cell>
                        <Table.Cell>
                          <Input value={row.packaging} readOnly={isReadOnly}  placeholder={t.sales_inquiry.packaging_placeholder} onChange={(e) => updateItemField(index, "packaging", e.target.value)}/>
                        </Table.Cell>
                        <Table.Cell>
                          {!isReadOnly && (
                          <IconButton aria-label="Remove" variant="ghost" color="red" onClick={() => removeItemRow(index)}>
                            <FaTrash />
                          </IconButton>
                        )}
                        </Table.Cell>
                      </Table.Row >
                    ))}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>

            <Flex justify="flex-end" mt={5}>
              {/* if the inqiry was create for the first time then save as draft */}
              {mode === "create" && (
                <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.sales_inquiry.save_draft}</Button>
              )}
            </Flex>

            {rfqStatus === "draft" && (
              <Flex justify={"flex-end"}>
                <Button bg="#E77A1F" color="white" onClick={handleSave}>{t.master.submit}</Button>
              </Flex>
            )}
            
            {rfqStatus === "submitted" && (
                <Flex gap={3} justifyContent={"space-between"}>
                  <Button variant="outline">{t.master.export_pdf}</Button>
                  <Flex gap={6}>
                    <Button color="red" borderColor={"red"} variant="outline">{t.master.reject}</Button>
                    <Button backgroundColor="green">{t.master.approve}</Button>
                  </Flex>
                </Flex>
              )}
          </Card.Body>
        </Card.Root>


  {mode === "view" && (
  <Card.Root mt={6}>
    <Card.Body>
      <Heading size="xl" mb={3}>History Log</Heading>

      {historyData.map((log, index) => (
        <Flex key={index} justify="space-between" mb={2}>
          <Text fontSize="sm">
            {log.notes} by <b>{log.action_by}</b>
          </Text>
          <Text fontSize="xs" color="gray.500">
            {log.action_at
              ? new Date(log.action_at).toLocaleString(
                  lang === "id" ? "id-ID" : "en-US",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  }
                )
              : "-"}
          </Text>
        </Flex>
      ))}
    </Card.Body>
  </Card.Root>
)}

        
      </SidebarWithHeader>
    );
}