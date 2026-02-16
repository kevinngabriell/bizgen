"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Input, Textarea, Heading, Badge, Field, Card, Text, Table, IconButton, SimpleGrid, createListCollection, Select, Portal } from "@chakra-ui/react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { FaTrash } from "react-icons/fa";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { useRouter } from "next/navigation";
import { getLang } from "@/lib/i18n";
import { GetCustomerData } from "@/lib/master/customer";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import { getAllOrigin, GetOriginData } from "@/lib/master/origin";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { getAllUOM, UOMData } from "@/lib/master/uom";

type InquiryMode = "create" | "view" | "edit";

export default function Inquiry() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);
  
  //set mode for create/update/view
  const [mode, setMode] = useState<InquiryMode>("create");
  const isReadOnly = mode === "view";
  
  const handleEdit = () => setMode("edit");
  const handleCancelEdit = () => setMode("view");

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

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
  const [uomSelected, setUOMSelected] = useState<string>();
  const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);
  
  const uomCollection = createListCollection({
    items: uomOptions.map((uom) => ({
      label: `${uom.uom_name}`,
      value: uom.uom_id,
    })),
  });

  useEffect(() => {

    const fetchShipmentType = async () => {
      try {
        const shipmentTypeRes = await getAllShipVia(1, 1000);
        setShipmentTypeOptions(shipmentTypeRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setShipmentTypeOptions([]);
      }
    };

    const fetchCountry = async () => {
      try {
        const countryRes = await getAllOrigin(1, 1000);
        setCountryOptions(countryRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setCountryOptions([]);
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

    const fetchUOM = async () => {
      try {
        const uomRes = await getAllUOM(1, 1000);
        setUOMOptions(uomRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setUOMOptions([]);
      }
    };

    fetchShipmentType();
    fetchCountry();
    fetchTerm();
    fetchUOM();

    init();
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
    
  // Simulated inquiry data (replace later wiTable.ColumnHeader API data)
  const [form, setForm] = useState({
    inquiryNo: "",
    customerName: "",
    contactPerson: "",
    customerEmail: "",
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

  const handleSave = () => {
  
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

  const handleChooseCustomer = (customer: GetCustomerData) => {
  setForm(prev => ({
    ...prev,
    customerName: customer.customer_name,
    contactPerson: customer.customer_pic_name,
    customerPhone: customer.customer_pic_contact
  }));

  setCustomerModalOpen(false);
};
    
  //set loading process
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" mb={4}>
        
        <Heading size="md">
          {mode === "create" && t.sales_inquiry.title_create}
          {mode === "view" && t.sales_inquiry.title_view}
          {mode === "edit" && t.sales_inquiry.title_edit}
        </Heading>

        <Badge color={mode === "create" ? "blue" : mode === "edit" ? "yellow" : "green"}>
          {mode.toUpperCase()}
        </Badge>
      </Flex>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)}
      onChoose={handleChooseCustomer} />

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{base: 1 ,md: 2}} gap={6}>
            <Field.Root>
              <Field.Label>{t.sales_inquiry.inquiry_no}</Field.Label>
              <Input name="inquiryNo" value={form.inquiryNo} onChange={handleChange} readOnly={isReadOnly} placeholder={t.sales_inquiry.inquiry_no_placeholder}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_inquiry.customer_name}</Field.Label>
              <Input value={form.customerName} placeholder={t.sales_inquiry.customer_placeholder} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_inquiry.contact_person}</Field.Label>
              <Input name="contactPerson" value={form.contactPerson} placeholder={t.sales_inquiry.contact_person_placeholder} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_inquiry.phone}</Field.Label>
              <Input name="customerPhone" value={form.customerPhone} placeholder={t.sales_inquiry.phone_placeholder} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_inquiry.shipment_type}</Field.Label>
              <Select.Root collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []} onValueChange={(details) => setShipmentTypeSelected(details.value[0])} size="sm" width="100%">
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
            <Field.Root>
              <Field.Label>{t.sales_inquiry.origin_country}</Field.Label>
              <Select.Root collection={countryCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} size="sm" width="100%">
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
            <Field.Root>
              <Field.Label>{t.sales_inquiry.destination_country}</Field.Label>
              <Select.Root collection={countryCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} size="sm" width="100%">
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
            <Field.Root>
              <Field.Label>{t.sales_inquiry.commodity}</Field.Label>
              <Input name="commodity" value={form.commodity} onChange={handleChange} readOnly={isReadOnly} placeholder={t.sales_inquiry.commodity_placeholder}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_inquiry.incoterm}</Field.Label>
              <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} size="sm" width="100%">
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
          
          <Card.Root mt={6}>
            <Card.Body>
              <Flex justify="space-between" align="center" mb="3">
                <Heading size="md">{t.sales_inquiry.item_list_title}</Heading>
                <Button size="sm" bg="#E77A1F" color="white" onClick={addItemRow}>{t.sales_inquiry.add_item}</Button>
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
                        <Input value={row.name} placeholder={t.sales_inquiry.item_name_placeholder} onChange={(e) => updateItemField(index, "name", e.target.value)}/>
                      </Table.Cell>
                      <Table.Cell>
                        <Input value={row.hsCode} placeholder={t.sales_inquiry.hs_code_placeholder} onChange={(e) => updateItemField(index, "hsCode", e.target.value)}/>
                      </Table.Cell>
                      <Table.Cell>
                        <Input value={row.qty} placeholder={t.sales_inquiry.qty} onChange={(e) => updateItemField(index, "qty", e.target.value)}/>
                      </Table.Cell>
                      <Table.Cell>
                        <Select.Root collection={uomCollection} value={row.unit ? [row.unit] : []} onValueChange={(details) => updateItemField(index, "unit", details.value[0])} size="sm" width="100%">
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
                        <Input value={row.weight} placeholder={t.sales_inquiry.weight_placeholder} onChange={(e) => updateItemField(index, "weight", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.cbm} placeholder={t.sales_inquiry.cbm_placeholder} onChange={(e) => updateItemField(index, "cbm", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.packaging} placeholder={t.sales_inquiry.packaging_placeholder} onChange={(e) => updateItemField(index, "packaging", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <IconButton aria-label="Remove" variant="ghost" color="red" onClick={() => removeItemRow(index)}>
                          <FaTrash/>  
                        </IconButton>
                      </Table.Cell>
                    </Table.Row >
                  ))}
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>

          <Flex justify="flex-end" mt={5}>
            {mode === "view" && (
              <Button color="yellow" onClick={handleEdit}>{t.sales_inquiry.edit}</Button>
            )}

            {mode === "create" && (
              <Button bg="#E77A1F" color="white" >{t.sales_inquiry.save_draft}</Button>
            )}

            {mode !== "create" && (
              <Button color="purple">{t.sales_inquiry.submit}</Button>
            )}

            {mode === "view" && (
              <Button color="green">{t.sales_inquiry.export_pdf}</Button>
            )}
          </Flex>
        </Card.Body>
      </Card.Root>

      
    </SidebarWithHeader>
  );
}