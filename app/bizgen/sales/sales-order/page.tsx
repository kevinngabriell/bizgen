'use client';

import { Suspense, useEffect, useState } from 'react';
import { Box, Button, Card, createListCollection, Field, Flex, Heading, Input, Portal, Select, Separator, SimpleGrid, Text, Textarea } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import Loading from '@/components/loading';
import { getLang } from '@/lib/i18n';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { GetCustomerData } from '@/lib/master/customer';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import { generateSalesNumber } from '@/lib/sales/sales-order';
import { AlertMessage } from '@/components/ui/alert';
import { FaTrash } from 'react-icons/fa';

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

  //form fields
  const [salesOrderNumber, setSalesOrderNumber] = useState("");
  const [inquiryRef, setInquiryRef] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [taxType, setTaxType] = useState("");
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
          shipViaRes,
          portRes,
          termRes
        ] = await Promise.all([
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
      if (!salesOrderID) return;
    }

    const loadGeneratedNumber = async () => {
      if (salesOrderID) return;

      try {
        const res = await generateSalesNumber();
        setSalesOrderNumber(res.number);
        // setForm(prev => ({
        //   ...prev,
        //   inquiryNo: res.number,
        // }));
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
  const [items, setItems] = useState([
    {
      id: Date.now(),
      purchaseOrderNo: "",
      productName: "",
      quantity: "",
      uom: "",
      unitPrice: "",
      dpp: "",
      ppn: "",
      total: ""
    }
  ]);

  const handleItemChange = (id: number, field: string, value: string) => {
    setItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        purchaseOrderNo: "",
        productName: "",
        quantity: "",
        uom: "",
        unitPrice: "",
        dpp: "",
        ppn: "",
        total: ""
      }
    ]);
  };

  const removeItemRow = (id: number) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  };

  //calculate totals
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
      // setForm(prev => ({
      //   ...prev,
      //   customerName: customer.customer_name,
      //   contactPerson: customer.customer_pic_name,
      //   customerPhone: customer.customer_pic_contact
      // }));
      
      setCustomerModalOpen(false);
  };
    
  const handleSubmit = async () => {
    setLoading(true);

    try {

    } catch (err) {

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
              <Field.Label>Sales Order Number <Field.RequiredIndicator/></Field.Label>
                <Input placeholder='Please input sales order' value={salesOrderNumber}onChange={(e) => setSalesOrderNumber(e.target.value)}/>
            </Field.Root> 
            <Field.Root>
              <Field.Label>{t.sales_order.inquiry_quotation_ref}</Field.Label>
              <Input
                placeholder={t.sales_order.inquiry_quotation_ref_placeholder}
                value={inquiryRef}
                onChange={(e) => setInquiryRef(e.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_order.order_date} <Field.RequiredIndicator/></Field.Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>Tax Type</Field.Label>
              <Input
                placeholder="Tax type"
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.sales_order.customer}<Field.RequiredIndicator/></Field.Label>
                <Input
                  placeholder={t.sales_order.customer_placeholder}
                  value={selectedCustomer?.customer_name ?? ""}
                  readOnly
                  cursor="pointer"
                  onClick={() => setCustomerModalOpen(true)}
                />
            </Field.Root>
            <Field.Root>
              <Field.Label>Customer Information</Field.Label>
              <Text fontSize={"sm"}>Address</Text>
              <Text fontSize={"sm"}>TOP</Text>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.service_type}</Field.Label>
                <Select.Root
                  collection={jobTypeOptions}
                  value={jobTypeSelected ? [jobTypeSelected] : []}
                  onValueChange={(details) => setJobTypeSelected(details.value[0])}
                  size="sm"
                >
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
                <Select.Root
                  collection={shipmentTypeCollection}
                  value={shipmentTypeSelected ? [shipmentTypeSelected] : []}
                  onValueChange={(details) => setShipmentTypeSelected(details.value[0])}
                  size="sm"
                >
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
              <Input
                placeholder={t.sales_order.sales_person_placeholder}
                value={salesPerson}
                onChange={(e) => setSalesPerson(e.target.value)}
              />
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Heading size="md" mt={5} mb={3}>{t.sales_order.origin_destination}</Heading>

          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={6} mb={4}>
              <Field.Root>
              <Field.Label>{t.sales_order.origin_port}</Field.Label>
                <Select.Root collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} size="sm" width="100%">
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
              <Select.Root collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} size="sm" width="100%">
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
              <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} size="sm" width="100%">
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
              <Field.Label>ETD<Field.RequiredIndicator/> </Field.Label>
              <Input
                type="date"
                value={etd}
                onChange={(e) => setEtd(e.target.value)}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>ETA<Field.RequiredIndicator/></Field.Label>
              <Input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
              />
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Heading size="md" mt={6} mb={4}>{t.sales_order.cargo_details}</Heading>

          <Box overflowX="auto" width="100%">
            <Box minW="1000px">
              {items.map((item) => (
                <SimpleGrid
                  key={item.id}
                  minW="1200px"
                  templateColumns="200px 220px 120px 120px 160px 160px 160px 180px 120px"
                  gap={4}
                  mb={4}
                >
                  
                  <Field.Root>
                    <Field.Label>PO Number</Field.Label>
                    <Input
                      placeholder="Purchase Order Number"
                      value={item.purchaseOrderNo}
                      onChange={(e) => handleItemChange(item.id, "purchaseOrderNo", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Product Name</Field.Label>
                    <Input
                      placeholder="Product name"
                      value={item.productName}
                      onChange={(e) => handleItemChange(item.id, "productName", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Quantity</Field.Label>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Unit</Field.Label>
                    <Input
                      placeholder="UOM"
                      value={item.uom}
                      onChange={(e) => handleItemChange(item.id, "uom", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Unit Price</Field.Label>
                    <Input
                      type="number"
                      placeholder="Unit price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>DPP (Before Tax)</Field.Label>
                    <Input
                      type="number"
                      placeholder="DPP"
                      value={item.dpp}
                      onChange={(e) => handleItemChange(item.id, "dpp", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>PPN (Tax)</Field.Label>
                    <Input
                      type="number"
                      placeholder="PPN"
                      value={item.ppn}
                      onChange={(e) => handleItemChange(item.id, "ppn", e.target.value)}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Total</Field.Label>
                    <Input
                      type="number"
                      placeholder="Total"
                      value={item.total}
                      onChange={(e) => handleItemChange(item.id, "total", e.target.value)}
                    />
                  </Field.Root>

                  <Flex align="flex-end">
                    <Button
                      color="red"
                      borderColor={"red"}
                      variant="outline"
                      onClick={() => removeItemRow(item.id)}
                    >
                      <FaTrash color='red'/>
                      Delete
                    </Button>
                  </Flex>

                </SimpleGrid>
              ))}

              {/* TOTAL ROW */}
              <Box mt={2} pt={2} borderTop="2px solid" borderColor="gray.300">
                <SimpleGrid minW="1200px" templateColumns="200px 220px 120px 120px 160px 160px 160px 180px 120px"gap={4}mb={4}>
                  <Text fontWeight="bold">TOTAL</Text>
                  <Box></Box>
                  <Box></Box>
                  <Box></Box>
                  <Input value={totals.unitPrice} readOnly textAlign="right" fontWeight="bold" />
                  <Input value={totals.dpp} readOnly textAlign="right" fontWeight="bold" />
                  <Input value={totals.ppn} readOnly textAlign="right" fontWeight="bold" />
                  <Input value={totals.total} readOnly textAlign="right" fontWeight="bold" />
                </SimpleGrid>
              </Box>
            </Box>
          </Box>

          <Button mt={2} bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={addItemRow}>
            Add Item
          </Button>

          

          <Field.Root mt={4}>
            <Field.Label>{t.sales_order.remarks}</Field.Label>
            <Textarea
              rows={4}
              placeholder={t.sales_order.remarks_placeholder}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} >{t.sales_order.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} type="submit">{t.sales_order.save_sales_order}</Button>
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