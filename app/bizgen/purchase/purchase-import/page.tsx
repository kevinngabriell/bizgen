

"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { getAllOrigin, GetOriginData } from "@/lib/master/origin";
import { getAllSupplier, GetSupplierData } from "@/lib/master/supplier";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { Button, Flex, Heading, SimpleGrid, Field, Input, IconButton, Separator, Text, Card, NumberInput, createListCollection, Select, Portal } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { FaTrash } from "react-icons/fa";

type ItemRow = {
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export default function CreatePurchaseImportPage() {  
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [freightCost, setFreightCost] = useState(0);
  const [customsCost, setCustomsCost] = useState(0);

  const [supplierSelected, setSupplierSelected] = useState<string>();
  const [supplierOptions, setSupplierOptions] = useState<GetSupplierData[]>([]);

  const t = getLang("en");  
  const router = useRouter();

  

  const supplierCollection = createListCollection({
    items: supplierOptions.map((supplier) => ({
        label: `${supplier.supplier_name}`,
        value: supplier.supplier_id,
      })),
  });

  //currency
  const [currencySelected, setCurrencySelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((currency) => ({
        label: `${currency.currency_name} (${currency.currency_symbol})`,
        value: currency.currency_id,
      })),
  });

  //term
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, seetTermOptions] = useState<GetTermData[]>([]);

  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
        label: `${term.term_name}`,
        value: term.term_id,
      })),
  });

  //origin
  const [portofloadingSelected, setPortofLoadingSelected] = useState<string>();
  const [portofdischargeSelected, setPortofDischargeSelected] = useState<string>();
  const [originOptions, setOriginOptions] = useState<GetOriginData[]>([]);

  const originCollection = createListCollection({
    items: originOptions.map((origin) => ({
        label: `${origin.origin_name}`,
        value: origin.origin_id,
      })),
  });

  useEffect(() => {

    const fetchCurrency = async () => {
      try {
        const currencyRes = await getAllCurrency(1, 1000);
        setCurrencyOptions(currencyRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setCurrencyOptions([]);
      }
    };

    const fetchSupplier = async () => {
      try {
        const supplierRes = await getAllSupplier(1, 1000);
        setSupplierOptions(supplierRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setSupplierOptions([]);
      }
    };

    const fetchTerm = async () => {
      try {
        const termRes = await getAllTerm(1, 1000);
        seetTermOptions(termRes?.data ?? []);
      } catch (error) {
        console.error(error);
        seetTermOptions([]);
      }
    };

    const fetchOrigin = async () => {
      try {
        const originRes = await getAllOrigin(1, 1000);
        setOriginOptions(originRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setOriginOptions([]);
      }
    };
        
    fetchCurrency();
    fetchTerm();
    fetchSupplier();
    fetchOrigin();

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
    
  

  const [items, setItems] = useState<ItemRow[]>([
    { sku: "", description: "", qty: 1, unitPrice: 0 },
  ]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { sku: "", description: "", qty: 1, unitPrice: 0 },
    ]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (
    index: number,
    field: keyof ItemRow,
    value: string | number
  ) =>
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const itemsSubtotal = useMemo(
    () =>
      items.reduce(
        (sum, r) => sum + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0),
        0
      ),
    [items]
  );

  const landedCost = useMemo(
    () => itemsSubtotal + Number(freightCost || 0) + Number(customsCost || 0),
    [itemsSubtotal, freightCost, customsCost]
  );

  const localCurrencyTotal = useMemo(
    () => landedCost * Number(exchangeRate || 1),
    [landedCost, exchangeRate]
  );if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      {/* Heading Area */}
      <Heading size="lg">{t.purchase_import.title}</Heading>

      {/* Purchase details & import details card */}
      <Card.Root mt={4}>
        <Card.Body>
          {/* Purchase Details Header */}
          <Heading size="sm" mb={3}>{t.purchase_import.purchase_details}</Heading>

          {/* PO Number, PO Date, and Supplier Name */}
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={"20px"} mt={3} mb={8}>
            {/* PO Number */}
            <Field.Root>
              <Field.Label>{t.purchase_import.po_number}</Field.Label>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder={t.purchase_import.po_number_placeholder}/>
            </Field.Root>
            {/* PO Date */}
            <Field.Root>
              <Field.Label>{t.purchase_import.po_date}</Field.Label>
              <Input value={poDate} onChange={(e) => setPoDate(e.target.value)} placeholder="AUTO / Manual"/>
            </Field.Root>
            {/* Supplier Name */}
            <Field.Root>
              <Field.Label>{t.purchase_import.supplier}</Field.Label>
              <Select.Root collection={supplierCollection} value={supplierSelected ? [supplierSelected] : []} onValueChange={(details) => setSupplierSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_import.supplier_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {supplierCollection.items.map((supplier) => (
                        <Select.Item item={supplier} key={supplier.value}>
                          {supplier.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </SimpleGrid>

          <Separator/>

          {/* Import Details Header */}
          <Heading size="sm" mb={3} mt={6}>{t.purchase_import.import_details}</Heading>
          
          {/* Currency, exchange rate, incoterm, port of loading, port of dicharge, freight cost, customs/duty cost */}
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={"20px"} mt={3} mb={3}>
            {/* Currency */}
            <Field.Root>
              <Field.Label>{t.purchase_import.currency}</Field.Label>
              <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setCurrencySelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_import.currency_placeholder} />
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
            {/* Exchange Rate */}
            <Field.Root>
              <Field.Label>{t.purchase_import.exchange_rate}</Field.Label>
              {/* <NumberInput
                value={exchangeRate}
                min={0}
                onChange={(_, v) => setExchangeRate(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
            {/* Incoterm */}
            <Field.Root>
              <Field.Label>{t.purchase_import.incoterm}</Field.Label>
              <Select.Root collection={termCollection} value={termSelected ? [termSelected] : []} onValueChange={(details) => setTermSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_import.incoterm_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {termCollection.items.map((term) => (
                        <Select.Item item={term} key={term.value}>
                          {term.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            {/* Port of Loading */}
            <Field.Root>
              <Field.Label>{t.purchase_import.port_of_loading}</Field.Label>
              <Select.Root collection={originCollection} value={portofloadingSelected ? [portofloadingSelected] : []} onValueChange={(details) => setPortofLoadingSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_import.port_of_loading_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {originCollection.items.map((origin) => (
                        <Select.Item item={origin} key={origin.value}>
                          {origin.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            {/* Port of Discharge */}
            <Field.Root>
              <Field.Label>{t.purchase_import.port_of_discharge}</Field.Label>
              <Select.Root collection={originCollection} value={portofdischargeSelected ? [portofdischargeSelected] : []} onValueChange={(details) => setPortofDischargeSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_import.port_of_discharge_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {originCollection.items.map((origin) => (
                        <Select.Item item={origin} key={origin.value}>
                          {origin.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            {/* Freight Cost (USD) */}
            <Field.Root>
              <Field.Label>{t.purchase_import.freight_cost}</Field.Label>
              {/* <NumberInput
                value={freightCost}
                min={0}
                onChange={(_, v) => setFreightCost(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
            {/* Customer/Duty Cost (USD) */}
            <Field.Root>
              <Field.Label>{t.purchase_import.customs_cost}</Field.Label>
              {/* <NumberInput
                value={customsCost}
                min={0}
                onChange={(_, v) => setCustomsCost(v || 0)}
              >
                <NumberInputField />
              </NumberInput> */}
            </Field.Root>
          </SimpleGrid>

        </Card.Body>
      </Card.Root>
      
      {/* Items card */}
      <Card.Root mt={6}>
        <Card.Body>
          {/* Heading and add item button */}
          <Flex alignItems={"center"} justifyContent={"space-between"} mb={8}>
            <Heading size="sm">{t.purchase_import.items}</Heading>
            <Button size="sm" variant="outline" onClick={addItem}>{t.purchase_import.add_item}</Button>
          </Flex>

          {items.map((row, i) => (
            <Card.Root key={i} mb={5}>
              <Card.Body>
                  <SimpleGrid columns={{base: 1, md: 2, lg: 4}} gap={"20px"}>
                    <Field.Root>
                      <Field.Label>{t.purchase_import.sku}</Field.Label>
                      <Input value={row.sku} onChange={(e) => updateItem(i, "sku", e.target.value)}/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>{t.purchase_import.description}</Field.Label>
                      <Input value={row.description} onChange={(e) => updateItem(i, "description", e.target.value)}/>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>{t.purchase_import.qty}</Field.Label>
                      <NumberInput.Root min={0}>
                        <NumberInput.Control/>
                        <NumberInput.Input />
                      </NumberInput.Root>
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>{t.purchase_import.unit_price}</Field.Label>
                      <NumberInput.Root min={0}>
                        <NumberInput.Control/>
                        <NumberInput.Input />
                      </NumberInput.Root>
                    </Field.Root>
                  </SimpleGrid>

                  <Flex justify="space-between" mt={2} align="center">
                    <Text fontSize="sm" color="gray.600"> {t.purchase_import.line_total}{" "} {(row.qty || 0) * (row.unitPrice || 0)} </Text>
                    {items.length > 1 && (
                      <IconButton p={3} aria-label="Remove item" size="sm" color={"red"} variant="ghost" onClick={() => removeItem(i)}>
                        <FaTrash/>
                        <Text>{t.purchase_import.delete_item}</Text>
                      </IconButton>
                    )}
                  </Flex>
              </Card.Body>
            </Card.Root>
          ))}
        </Card.Body>
      </Card.Root>

      <Card.Root mt={6}>
        <Card.Body>
          <Heading size="sm" mb={3}>{t.purchase_import.cost_summary}</Heading>
          
          <Text fontSize={"md"}>{t.purchase_import.items_subtotal} {itemsSubtotal.toLocaleString()} </Text>
          <Text>{t.purchase_import.freight_customs}:{" "} {(Number(freightCost) + Number(customsCost)).toLocaleString()}{" "}</Text>
          <Text fontWeight="semibold">{t.purchase_import.landed_cost}: {landedCost.toLocaleString()} </Text>
          <Text color="gray.600">{t.purchase_import.local_currency}: {localCurrencyTotal.toLocaleString("id-ID")}</Text>
        </Card.Body>
      </Card.Root>

      <Flex gap={3} justify="flex-end" mt={4}>
        <Button variant="outline">{t.purchase_import.save_draft}</Button>
        <Button colorScheme="blue">{t.purchase_import.submit_purchase}</Button>
      </Flex>

    </SidebarWithHeader>
    
  );
}