"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { Button, Card, Separator, Flex, Field, Heading, IconButton, Input, NumberInput, Text, Textarea, SimpleGrid, createListCollection, Select, Portal } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

type LineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  taxPct: number;
};

export default function CreateInvoicePage() {
  const [currency, setCurrency] = useState<string>("IDR");
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [currencySelected, setCurrencySelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const t = getLang("en"); 
  
  const currencyCollection = createListCollection({
      items: currencyOptions.map((currency) => ({
        label: `${currency.currency_name} (${currency.currency_symbol})`,
        value: currency.currency_id,
      })),
    });

  useEffect(() => {
    const fetchCurrency = async () => {
          try {
            setLoading(true);
            const currencyRes = await getAllCurrency(1, 1000);
            setCurrencyOptions(currencyRes?.data ?? []);
          } catch (error) {
            console.error(error);
            setCurrencyOptions([]);
          } finally {
            setLoading(false);
          }
        };
    
    fetchCurrency();
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    try {

    } catch (error: any){

    } finally {
      setLoading(false);
    }
  }
    
  if (loading) return <Loading/>;

  const [items, setItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      qty: 1,
      unitPrice: 0,
      taxPct: 0,
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        qty: 1,
        unitPrice: 0,
        taxPct: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const subtotal = items.reduce(
    (sum, i) => sum + i.qty * i.unitPrice,
    0
  );
  const taxTotal = items.reduce(
    (sum, i) => sum + (i.qty * i.unitPrice * i.taxPct) / 100,
    0
  );
  const grandTotal = subtotal + taxTotal;

  const handleSave = (mode: "draft" | "post") => {
    // TODO: integrate with API
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading>Create Invoice</Heading>

      <Card.Root mt={4}>
        <Card.Header>
          <Heading size="md">Invoice Details</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Field.Root>
              <Field.Label>Customer</Field.Label>
              <Input placeholder="Select / Search Customer" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Invoice No</Field.Label>
              <Input placeholder="INV-2026-0001" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Invoice Date</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Due Date</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Currency</Field.Label>
              <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setCurrencySelected(details.value[0])} size="sm" width="100%">
                              <Select.HiddenSelect />
                              <Select.Control>
                                <Select.Trigger>
                                  <Select.ValueText placeholder={t.bank_account.select_currency_placeholder} />
                                </Select.Trigger>
                                <Select.IndicatorGroup>
                                  <Select.Indicator />
                                </Select.IndicatorGroup>
                              </Select.Control>
                              <Portal>
                                <Select.Positioner>
                                  <Select.Content>
                                    {currencyCollection.items.map((currency) => (
                                      <Select.Item item={currency} key={currency.value}>
                                        {currency.label}
                                        <Select.ItemIndicator />
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select.Positioner>
                              </Portal>
                          </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Exchange Rate</Field.Label>
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
          </SimpleGrid>

          <Field.Root>
            <Field.Label>Reference</Field.Label>
            <Input placeholder="(Optional) PO / Job / Shipment Ref" />
          </Field.Root>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Line Items</Heading>
            <Button size="sm" variant="outline" onClick={addItem}>Add Item</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {items.map((item, idx) => (
            <Card.Root key={item.id} mb={6}>
                <Card.Header>
                  <Flex justify={"space-between"} alignItems={"center"}>
                    <Text fontWeight="medium">Item {idx + 1}</Text>
                    <IconButton aria-label="Remove item" size="sm" variant="ghost" onClick={() => removeItem(item.id)} color={"red"}>
                      <FaTrash/>  
                    </IconButton>
                  </Flex>
                </Card.Header>
                <Card.Body>
                  <SimpleGrid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr",}} gap={3}>
                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Input placeholder="Service / Product description" value={item.description} onChange={(e) => updateItem( item.id, "description", e.target.value)}/>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Qty</Field.Label>
                      <NumberInput.Root>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Unit Price</Field.Label>
                      <NumberInput.Root>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>Tax %</Field.Label>
                      <NumberInput.Root>
                        <NumberInput.Control/>
                        <NumberInput.Input/>
                      </NumberInput.Root>
                    </Field.Root>
                  </SimpleGrid>
                </Card.Body>
            </Card.Root>
          ))}
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md">Summary</Heading>
        </Card.Header>
        <Card.Body>
          <Flex justify="space-between" mb={2}>
            <Text fontSize={"sm"}>Subtotal</Text>
            <Text fontSize={"sm"} fontWeight="medium">{subtotal.toLocaleString()}</Text>
          </Flex>
          <Flex justify="space-between" mb={2}>
            <Text fontSize={"sm"}>Tax</Text>
            <Text fontSize={"sm"} fontWeight="medium">{taxTotal.toLocaleString()}</Text>
          </Flex>
          <Separator mt={2} mb={2}/>
          <Flex justify="space-between" mt={2}>
            <Text fontSize={"sm"}>Grand Total</Text>
            <Text fontSize={"sm"} fontWeight="medium">{grandTotal.toLocaleString()}</Text>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md">Notes</Heading>
        </Card.Header>
        <Card.Body>
          <Field.Root>
            <Field.Label>Notes (Optional)</Field.Label>
            <Textarea placeholder="Additional notes to customer…" />
          </Field.Root>
        </Card.Body>
      </Card.Root>

      <Flex gap={3} justify="flex-end" mt={6}>
        <Button variant="outline" onClick={() => handleSave("draft")}>Save as Draft</Button>
        <Button colorScheme="blue" onClick={() => handleSave("post")}>Post Invoice</Button>
      </Flex>
    </SidebarWithHeader>
    
  );
}