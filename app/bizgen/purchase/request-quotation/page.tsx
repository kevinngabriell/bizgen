"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import { GetPortData } from "@/lib/master/port";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { Button, Card, Flex, Field, IconButton, Input, Text, Textarea, Heading, SimpleGrid, createListCollection } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

// import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

type ItemRow = {
  id: string;
  description: string;
  hsCode: string;
  qty: string;
  uom: string;
  unitPrice: string;
  currency: string;
};

export default function CreateRequestQuotationPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [customerSelected, setCustomerSelected] = useState<string>();
  const [customerOptions, setCustomerOptions] = useState<GetCustomerData[]>([]);

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

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

  //currency option
  const [currencySelected, setSelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
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
        
  fetchShipVia();
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

  const [items, setItems] = useState<ItemRow[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      hsCode: "",
      qty: "",
      uom: "",
      unitPrice: "",
      currency: "USD",
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        hsCode: "",
        qty: "",
        uom: "",
        unitPrice: "",
        currency: "USD",
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmit = () => {

  };

  const handleChooseCustomer = (customer: GetCustomerData) => {
    // setForm(prev => ({
    //   ...prev,
    //   customerName: customer.customer_name,
    //   contactPerson: customer.customer_pic_name,
    //   customerPhone: customer.customer_pic_contact
    // }));
    
    setCustomerModalOpen(false);
  };

 if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading>Create Request Quotation</Heading>

          <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
            
          <Flex gap={6}>
            <Button variant="outline" onClick={handleSubmit}>Save as Draft</Button>
            <Button colorScheme="blue" onClick={handleSubmit}>Submit Request</Button>
          </Flex>
        </Flex>

        <Card.Root mb={6}>
          <Card.Header>
            <Heading fontWeight="semibold">Request Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              <Field.Root>
                <Field.Label>Inquiry Reference (optional)</Field.Label>
                <Input placeholder="Select or input inquiry reference" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Customer / Buyer</Field.Label>
                <Input placeholder="Customer name" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Contact Person</Field.Label>
                <Input placeholder="Contact person name" />
              </Field.Root>
              <Field.Root>
                <Field.Label>WhatsApp / Phone</Field.Label>
                <Input placeholder="+62…" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Shipment Type</Field.Label>
              </Field.Root>
              <Field.Root>
                <Field.Label>Service Type</Field.Label>
              </Field.Root>
              <Field.Root>
                <Field.Label>Origin</Field.Label>
                <Input placeholder="City / Port of loading" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Destination</Field.Label>
                <Input placeholder="City / Port of discharge" />
              </Field.Root>
              <Field.Root>
                <Field.Label>Additional Notes</Field.Label>
                <Textarea placeholder="Add shipment context, special handling, etc." />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        <Card.Root mb={6}>
          <Card.Header>
            <Flex justify={"space-between"}>
              <Heading>Goods / Item Details</Heading>
              <Button size="sm" onClick={addItem}>Add Item</Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            {items.map((item, index) => (
              <Card.Root key={item.id} p={2} mb={2}>
                <Card.Body>
                  <Flex justify="space-between" mb={2}>
                    <Text fontWeight="medium">Item {index + 1}</Text>
                    <IconButton aria-label="Remove item" size="sm" variant="ghost" color="red" onClick={() => removeItem(item.id)}>
                      <FaTrash/>
                    </IconButton>
                  </Flex>

                  <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Product description"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>HS Code</Field.Label>
                      <Input value={item.hsCode} onChange={(e) => updateItem(item.id, "hsCode", e.target.value)}placeholder="e.g. 09012120"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Currency</Field.Label>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Quantity</Field.Label>
                      <Input value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} placeholder="0"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>UOM</Field.Label>
                      <Input value={item.uom} onChange={(e) => updateItem(item.id, "uom", e.target.value)} placeholder="CTN / KG / PCS"/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Unit Price</Field.Label>
                      <Input value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)} placeholder="0.00"/>
                    </Field.Root>

                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            ))}
          </Card.Body>
        </Card.Root>

        <Flex justify="flex-end" gap={6}>
          <Button variant="outline" onClick={handleSubmit}>Save as Draft</Button>
          <Button colorScheme="blue" onClick={handleSubmit}>Submit Request</Button>
        </Flex>
    </SidebarWithHeader>
    
  );
}