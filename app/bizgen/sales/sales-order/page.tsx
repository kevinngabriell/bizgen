'use client';

import { Suspense, useEffect, useState } from 'react';
import { Box, Button, Card, Combobox, createListCollection, Field, Flex, Heading, Input, Portal, Select, Separator, SimpleGrid, Text, Textarea, useFilter, useListCollection } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import Loading from '@/components/loading';
import { getLang } from '@/lib/i18n';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { GetCustomerData } from '@/lib/master/customer';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import { createSalesOrder, generateSalesNumber } from '@/lib/sales/sales-order';
import { AlertMessage } from '@/components/ui/alert';
import { FaTrash } from 'react-icons/fa';
import { getAllTax, GetTaxData } from '@/lib/master/tax';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { getAllItem, GetItemData } from '@/lib/master/item';

type SalesOrderMode = "create" | "view" | "edit";

export default function CreateSalesOrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SalesOrderContent />
    </Suspense>
  );
}

function SalesOrderContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

   //retrieve rfq ID
  const searchParams = useSearchParams();
  const salesOrderID = searchParams.get("sales_order_id");
  
  const [salesOrderStatus, setSalesOrderStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  //set mode for create/update/view
  const [mode, setMode] = useState<SalesOrderMode>("create");
  const isReadOnly = mode === "view" && salesOrderStatus !== "draft" && salesOrderStatus !== "rejected";
  
  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);
  const [selectecCustomerID, setSelectedCustomerID] = useState("");

  //form fields
  const [salesOrderNumber, setSalesOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [jobTypeSelected, setJobTypeSelected] = useState<string>();
  const [etd, setEtd] = useState("");
  const [eta, setEta] = useState("");
  const [remarks, setRemarks] = useState("");

  //shipment type option
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
    })),
  });

  const [taxSelected, setTaxSelected] = useState<string>();
  const [taxOptions, setTaxOptions] = useState<GetTaxData[]>([]);

  const taxCollection = createListCollection({
    items: taxOptions.map((tax) => ({
      label: `${tax.tax_name}`,
      value: tax.tax_id,
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
      value: term.term_id
    }))
  });

  const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);
    
  const uomCollection = createListCollection({
    items: uomOptions.map((uom) => ({
      label: `${uom.uom_name}`,
      value: uom.uom_id,
    })),
  });

  const [itemCollections, setItemCollections] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" })

  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  })
  
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

        const [shipViaRes, portRes, termRes, taxRes, uomRes, itemRes] = await Promise.all([
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllTerm(1, 1000),
          getAllTax(1, 1000),
          getAllUOM(1, 1000),
          getAllItem(1, 10000)
        ]);

        setShipmentTypeOptions(shipViaRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setTermOptions(termRes?.data ?? []);
        setTaxOptions(taxRes?.data ?? []);
        setUOMOptions(uomRes?.data ?? []);

        const itemData = itemRes?.data ?? [];

        setItemCollection(itemData);
        setItemCollections(itemData);

      } catch (err) {
        console.error(err);
      }
    }

    const loadDetail = async () => {
      if (!salesOrderID) return;
    }

    const loadGeneratedNumber = async () => {
      if (salesOrderID) return;

      try {
        const res = await generateSalesNumber();
        setSalesOrderNumber(res.number);
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

  }, [salesOrderID]);

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
  
  //cargo item rows
  const [items, setItems] = useState([{id: Date.now(), purchaseOrderNo: "", productName: "", quantity: "", uom: "", unitPrice: "", dpp: "", ppn: "", total: "", notes: ""}]);

  // Handle item changes and auto calculate DPP, PPN, Total based on selected tax
  const handleItemChange = (id: number, field: string, value: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        const qty = parseFloat(updated.quantity || "0");
        const price = parseFloat(updated.unitPrice || "0");

        const baseDpp = qty * price;

        // find selected tax
        const selectedTax = taxOptions.find(t => t.tax_id === taxSelected);

        let dpp = baseDpp;
        let ppn = 0;

        if (selectedTax) {
          const rate = parseFloat(selectedTax.tax_rate || "0") / 100;

          if (selectedTax.calculation_method === "normal") {
            // normal: PPN = DPP * rate
            ppn = baseDpp * rate;
          } else if (selectedTax.calculation_method === "dpp_adjusted") {
            // special (12% rule): DPP = base / 1.11 then tax from adjusted DPP
            dpp = baseDpp / 1.11;
            ppn = dpp * rate;
          }
        }

        const total = dpp + ppn;

        return {
          ...updated,
          dpp: dpp.toFixed(2),
          ppn: ppn.toFixed(2),
          total: total.toFixed(2)
        };
      })
    );
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {id: Date.now(), purchaseOrderNo: "", productName: "", quantity: "",
        uom: "",
        unitPrice: "",
        dpp: "", ppn: "", total: "", notes: ""
      }
    ]);
  };

  const removeItemRow = (id: number) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  };

  // Format number to comma-separated string (e.g., 4,000,000.00)
  const formatNumber = (value: string) => {
    if (!value) return '';

    const cleaned = value.replace(/,/g, '');

    if (cleaned === '' || cleaned === '.') return cleaned;

    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const formattedInt = Number(integerPart || 0).toLocaleString('en-US');

    return decimalPart !== undefined ? `${formattedInt}.${decimalPart}` : formattedInt;
  };

  // Parse formatted number input back to raw numeric string
  const parseNumber = (value: string) => {
    // remove commas
    let cleaned = value.replace(/,/g, '');

    // allow only numbers and decimal point
    cleaned = cleaned.replace(/[^0-9.]/g, '');

    // prevent multiple decimals
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // limit to 2 decimal digits
    const [integerPart, decimalPart] = cleaned.split('.');
    if (decimalPart !== undefined) {
      cleaned = `${integerPart}.${decimalPart.slice(0, 2)}`;
    }

    return cleaned;
  };

  // Calculate grand totals for all items
  const totals = items.reduce(
    (acc, item) => {
      const unitPrice = parseFloat(item.unitPrice || "0");
      const dpp = parseFloat(item.dpp || "0");
      const ppn = parseFloat(item.ppn || "0");
      const total = parseFloat(item.total || "0");

      acc.unitPrice += unitPrice;
      acc.dpp += dpp;
      acc.ppn += ppn;
      acc.total += total;

      return acc;
    },
    { unitPrice: 0, dpp: 0, ppn: 0, total: 0 }
  );

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };
    
  // Handle form submission with validation
  const handleSubmit = async () => {
    setLoading(true);

    try {
      if(!salesOrderNumber)
        throw new Error(t.sales_order.error_1);
      if(!selectedCustomer?.customer_id)
        throw new Error(t.sales_order.error_2);
      if(!orderDate)
        throw new Error(t.sales_order.error_3);
      if(!termSelected)
        throw new Error(t.sales_order.error_4);
      if(!etd)
        throw new Error(t.sales_order.error_5);
      if(!eta)
        throw new Error(t.sales_order.error_6);
      if(items.length === 0)
        throw new Error(t.sales_order.error_7);

      const payload = {
        sales_order_no: salesOrderNumber,
        customer_id: selectedCustomer.customer_id,
        inquiry_ref: "",
        order_date: orderDate,
        sales_person: salesPerson || "",
        service_type: jobTypeSelected || "",
        ship_via_id: shipmentTypeSelected || "",
        origin_port: originSelected || "",
        destination_port: destinationSelected || "",
        term_id: termSelected || "",
        remarks: remarks || "",
        tax_id: taxSelected || "",
        eta: eta || "",
        etd: etd || "",
        items: items.map((row) => ({
          item_id: row.productName,
          quantity: row.quantity,
          unit_price: row.unitPrice,
          dpp: row.dpp,
          ppn: row.ppn,
          total: String(row.total ?? 0),
          notes: row.notes || ""
        }))
      }

      const res = await createSalesOrder(payload);

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.sales_order.success_create);

      // Reset form fields after successful submission
      setSalesOrderNumber("");
      setSelectedCustomer(null);
      setOrderDate("");
      setSalesPerson("");
      setJobTypeSelected(undefined);
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setTermSelected(undefined);
      setTaxSelected(undefined);
      setEtd("");
      setEta("");
      setRemarks("");
      setItems([{id: Date.now(), purchaseOrderNo: "", productName: "", quantity: "", uom: "", unitPrice: "", dpp: "", ppn: "", total: "", notes: ""}]);
      setTimeout(() => setShowAlert(false), 6000);
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.sales_costing_expense.error_msg);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg">{t.sales_order.title_create}</Heading>
      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      
      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}
      
      <Card.Root mt={4}>
        <Card.Header>
          <Heading>{t.sales_order.order_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={5} mb={6}>
            <Field.Root required>
              <Field.Label>{t.sales_order.sales_order_number}<Field.RequiredIndicator/></Field.Label>
                <Input placeholder={t.sales_order.sales_order_number_placeholder} value={salesOrderNumber} onChange={(e) => setSalesOrderNumber(e.target.value)}/>
            </Field.Root> 
            <Field.Root required>
              <Field.Label>{t.sales_order.order_date} <Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.tax}</Field.Label>
              <Select.Root collection={taxCollection} value={taxSelected ? [taxSelected] : []} onValueChange={(details) => {
                const selected = details.value[0];
                setTaxSelected(selected);

                // recalc all items
                setItems(prev =>
                  prev.map(item => {
                    const qty = parseFloat(item.quantity || "0");
                    const price = parseFloat(item.unitPrice || "0");

                    const baseDpp = qty * price;

                    const selectedTax = taxOptions.find(t => t.tax_id === selected);

                    let dpp = baseDpp;
                    let ppn = 0;

                    if (selectedTax) {
                      const rate = parseFloat(selectedTax.tax_rate || "0") / 100;

                      if (selectedTax.calculation_method === "normal") {
                        ppn = baseDpp * rate;
                      } else if (selectedTax.calculation_method === "dpp_adjusted") {
                        dpp = baseDpp / 1.11;
                        ppn = dpp * rate;
                      }
                    }

                    const total = dpp + ppn;

                    return {
                      ...item,
                      dpp: dpp.toFixed(2),
                      ppn: ppn.toFixed(2),
                      total: total.toFixed(2)
                    };
                  })
                );
              }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_order.tax_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {taxCollection.items.map((tax) => (
                         <Select.Item item={tax} key={tax.value}>{tax.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_order.customer}<Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.sales_order.customer_placeholder} value={selectedCustomer?.customer_name ?? ""} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.customer_information}</Field.Label>
              <Box fontSize="xs" color="gray.500" lineHeight="short">
                <Text>{selectedCustomer?.customer_address ?? "-"}</Text>
                <Text>{selectedCustomer?.customer_phone ?? "-"}</Text>
                <Text>TOP: {selectedCustomer?.customer_top ?? "-"}</Text>
              </Box>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.service_type}</Field.Label>
              <Select.Root collection={jobTypeOptions} value={jobTypeSelected ? [jobTypeSelected] : []} onValueChange={(details) => setJobTypeSelected(details.value[0])}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_order.service_type_placeholder} />
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
              <Field.Label>{t.sales_order.shipment_mode}</Field.Label>
                <Select.Root collection={shipmentTypeCollection} value={shipmentTypeSelected ? [shipmentTypeSelected] : []} onValueChange={(details) => setShipmentTypeSelected(details.value[0])}>
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.shipment_mode_placeholder} />
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
              <Field.Label>{t.sales_order.sales_person}</Field.Label>
              <Input placeholder={t.sales_order.sales_person_placeholder} value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Heading size="md" mt={5} mb={3}>{t.sales_order.origin_destination}</Heading>

          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={6} mb={4}>
            <Field.Root>
              <Field.Label>{t.sales_order.origin_port}</Field.Label>
              <Select.Root collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} width="100%">
                <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.origin_port_placeholder} />
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
              <Field.Label>{t.sales_order.destination_port}</Field.Label>
              <Select.Root collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.sales_order.destination_port_placeholder} />
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
              <Field.Label>{t.sales_order.incoterm}<Field.RequiredIndicator/></Field.Label>
              <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.incoterm_placeholder}/>
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

          <SimpleGrid columns={{base: 1, md: 2}} gap={6} mb={6}>
            <Field.Root required>
              <Field.Label>{t.sales_order.etd}<Field.RequiredIndicator/> </Field.Label>
              <Input type="date" value={etd} onChange={(e) => setEtd(e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_order.eta}<Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Heading size="md" mt={6} mb={4}>{t.sales_order.cargo_details}</Heading>

          <Box overflowX="auto">
            <Box>
              {items.map((item) => (
                <SimpleGrid key={item.id} templateColumns="200px 220px 120px 120px 160px 160px 160px 180px 120px" gap={4} mb={4}>
                  <Field.Root>
                    <Field.Label>{t.sales_order.product_name}</Field.Label>
                    <Combobox.Root key={`item-${item.id}`} collection={itemCollection} value={item.id ? [item.id.toString()] : []}
                      onValueChange={(details) => {
                      const selected = details.value?.[0];
                      handleItemChange(item.id, 'productName', selected ?? '');
                    }}
                    onInputValueChange={(e) => {
                      const input = e.inputValue ?? "";

                      if (!input || input.trim() === "") {
                        setItemCollection(itemCollections);
                        return;
                      }

                      const filtered = itemCollections.filter((item) =>
                        contains(`${item.item_code} - ${item.item_name}`, input)
                      );

                      setItemCollection(filtered);
                    }}>
                      <Combobox.Control>
                        <Combobox.Input placeholder={t.sales_order.product_name_placeholder} onFocus={() => setItemCollection(itemCollections)}/>
                        <Combobox.IndicatorGroup>
                          <Combobox.ClearTrigger />
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>{t.sales_order.no_product}</Combobox.Empty>
                              {itemCollection.items.map((item) => (
                                <Combobox.Item item={item} key={item.item_id}>
                                  {item.item_code} - {item.item_name}
                                  <Combobox.ItemIndicator />
                                </Combobox.Item>
                              ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_order.quantity_packaging}</Field.Label>
                    <Input type="number" placeholder={t.sales_order.quantity_packaging_placeholder} value={item.quantity} onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_order.uom}</Field.Label>
                    <Select.Root disabled={isReadOnly} collection={uomCollection} value={item.uom && uomCollection.items.some(i => i.value === item.uom) ? [item.uom] : []} onValueChange={(details) => handleItemChange(item.id, "uom", details.value?.[0] ?? "")} width="100%">
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
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t.sales_order.unit_price}</Field.Label>
                    <Input placeholder={t.sales_order.unit_price_placeholder} value={formatNumber(item.unitPrice)} onChange={(e) => handleItemChange(item.id, "unitPrice", parseNumber(e.target.value))}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_order.dpp}</Field.Label>
                    <Input placeholder={t.sales_order.dpp_placeholder} value={formatNumber(item.dpp)} readOnly/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_order.tax}</Field.Label>
                    <Input placeholder={t.sales_order.tax_placeholder} value={formatNumber(item.ppn)} readOnly/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_order.total}</Field.Label>
                    <Input placeholder={t.sales_order.total_placeholder} value={formatNumber(item.total)} readOnly/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_order.notes}</Field.Label>
                    <Input placeholder={t.sales_order.notes_placeholder} value={item.notes} onChange={(e) => handleItemChange(item.id, "notes", e.target.value)}/>
                  </Field.Root>

                  <Flex align="flex-end">
                    <Button color="red" borderColor={"red"} variant="outline" onClick={() => removeItemRow(item.id)}>
                      <FaTrash color='red'/>
                      {t.delete_popup.delete}
                    </Button>
                  </Flex>

                </SimpleGrid>
              ))}

              {/* TOTAL ROW */}
              <Box mt={2} pt={2} borderTop="2px solid" borderColor="gray.300">
                <SimpleGrid minW="1000px" templateColumns="200px 220px 120px 120px 160px 160px 160px 180px 120px"gap={4}mb={4}>
                  <Text fontWeight="bold">Total</Text>
                  <Box></Box>
                  <Box></Box>
                  <Input value={formatNumber(String(totals.unitPrice))} readOnly textAlign="right" fontWeight="bold" />
                  <Input value={formatNumber(String(totals.dpp))} readOnly textAlign="right" fontWeight="bold" />
                  <Input value={formatNumber(String(totals.ppn))} readOnly textAlign="right" fontWeight="bold" />
                  <Input value={formatNumber(String(totals.total))} readOnly textAlign="right" fontWeight="bold" />
                </SimpleGrid>
              </Box>
            </Box>
          </Box>
          <Button mt={2} bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={addItemRow}>
            {t.sales_order.add_item}
          </Button>
          <Field.Root mt={4}>
            <Field.Label>{t.sales_order.remarks}</Field.Label>
            <Textarea rows={4} placeholder={t.sales_order.remarks_placeholder} value={remarks} onChange={(e) => setRemarks(e.target.value)}/>
          </Field.Root>
          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} >{t.delete_popup.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.sales_order.save_sales_order}</Button>
          </Flex>
        </Card.Body>
      </Card.Root> 
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