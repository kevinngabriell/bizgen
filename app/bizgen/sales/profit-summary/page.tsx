"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import {Button, Flex, Heading, Input, SimpleGrid, Text, Separator, NumberInput, Badge, Card, Field, Select, Portal, createListCollection, Box} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

type LineItem = {
  id: string;
  itemName: string;
  qty: number;
  sellingPrice: number;
  landedCost: number;
};

export default function CreateProfitSummaryPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //PARAMETER DETAILNYA profit_id

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //currency option
  const [currencySelected, setSelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((cur) => ({
      label: `${cur.currency_name} (${cur.currency_symbol})`,
      value: cur.currency_id,
    })),
  });

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [referenceNo, setReferenceNo] = useState("");
  const [jobOrderNo, setJobOrderNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(15000);

  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    init();

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
    
  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        itemName: "",
        qty: 1,
        sellingPrice: 0,
        landedCost: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  };

  const updateItem = (
    list: LineItem[],
    setList: (v: LineItem[]) => void,
    id: string,
    key: keyof LineItem,
    value: any
  ) => {
    setList(list.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
  };

  const totalRevenue = items.reduce((sum, i) => sum + i.qty * i.sellingPrice, 0);
  const totalCost = items.reduce((sum, i) => sum + i.qty * i.landedCost, 0);
  const grossProfit = totalRevenue - totalCost;
  const grossProfitIdr = grossProfit * exchangeRate;

  const handleSubmit = () => {
    const payload = {
      reference_no: referenceNo,
      job_order_no: jobOrderNo,
      customer,
      currency,
      exchange_rate: exchangeRate,
      items,
      total_revenue: totalRevenue,
      total_cost: totalCost,
      gross_profit: grossProfit,
      gross_profit_idr: grossProfitIdr,
    };

    console.log("SUBMIT PROFIT SUMMARY", payload);
    // TODO: POST to API endpoint when ready
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
        <Heading size="lg">{t.sales_profit_summary.title_create}</Heading>
        <Badge colorScheme="blue">{t.sales_profit_summary.badge}</Badge>
      </Flex>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />

      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">{t.sales_profit_summary.header_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field.Root mb={2}>
              <Field.Label>{t.sales_profit_summary.reference_no}</Field.Label>
              <Input placeholder={t.sales_profit_summary.reference_no_placeholder} value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}/>
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>{t.sales_profit_summary.job_order_booking}</Field.Label>
              <Input placeholder={t.sales_profit_summary.job_order_booking_placeholder} value={jobOrderNo} onChange={(e) => setJobOrderNo(e.target.value)}/>
            </Field.Root>
            
          </SimpleGrid>
          <SimpleGrid columns={{base: 1, lg: 3}} gap={5} mt={4}>
            <Field.Root mb={2}>
              <Field.Label>{t.sales_profit_summary.customer}</Field.Label>
              <Input placeholder={t.sales_profit_summary.customer_placeholder} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>{t.sales_profit_summary.currency}</Field.Label>
              <Select.Root w={"100%"} collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />    
                  <Select.Control>    
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_profit_summary.currency_placeholder} />
                        </Select.Trigger>        
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {currencyCollection.items.map((currency) => (
                              <Select.Item item={currency} key={currency.value}>{currency.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>   
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>{t.sales_profit_summary.exchange_rate}</Field.Label>
              <NumberInput.Root w={"100%"}>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Items</Heading>
            <Button size="sm" bg="#E77A1F" color="white" onClick={addItem}>Add Item</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <Box overflowX="auto">
                      {items.map((item) => (
            <SimpleGrid templateColumns={"350px 150px 180px 180px 180px 100px"} key={item.id} gap={5} mb={3}>
              <Field.Root>
                <Field.Label>Product/Services</Field.Label>
                <Input placeholder="Item Name" value={item.itemName} onChange={(e) => updateItem(items, setItems, item.id, "itemName", e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Qty</Field.Label>
                <NumberInput.Root value={String(item.qty)} onValueChange={(d) => updateItem(items, setItems, item.id, "qty", Number(d.value))}>
                  <NumberInput.Control/>
                  <NumberInput.Input placeholder="Qty"/>
                </NumberInput.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Selling Price</Field.Label>
                <NumberInput.Root value={String(item.sellingPrice)} onValueChange={(d) => updateItem(items, setItems, item.id, "sellingPrice", Number(d.value))}>
                  <NumberInput.Control/>
                  <NumberInput.Input placeholder="Selling Price"/>
                </NumberInput.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Landed Cost</Field.Label>
                <NumberInput.Root value={String(item.landedCost)} onValueChange={(d) => updateItem(items, setItems, item.id, "landedCost", Number(d.value))}>
                  <NumberInput.Control/>
                  <NumberInput.Input placeholder="Landed Cost"/>
                </NumberInput.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Profit</Field.Label>
                <Text>
                  {(item.qty * (item.sellingPrice - item.landedCost)).toLocaleString()} 
                  ({item.sellingPrice > 0
                    ? (((item.sellingPrice - item.landedCost) / item.sellingPrice) * 100).toFixed(2)
                    : 0
                  }%)
                </Text>
                <Text fontSize="sm" color="gray.500">
                 
                </Text>
              </Field.Root>
              <Flex align="flex-end">
                <Button colorScheme="red" variant="ghost" onClick={() => removeItem(item.id)}>
                  Delete
                </Button>
              </Flex>
            </SimpleGrid>
          ))}

          </Box>

          <Separator />

          <Flex justify="space-between" mt={3}>
            <Text fontWeight="semibold">Total Revenue ({currency})</Text>
            <Text fontWeight="bold">{totalRevenue.toLocaleString()}</Text>
          </Flex>

          <Flex justify="space-between" mt={2}>
            <Text fontWeight="semibold">Total Cost ({currency})</Text>
            <Text fontWeight="bold">{totalCost.toLocaleString()}</Text>
          </Flex>

          <Flex justify="space-between" mt={2}>
            <Text fontWeight="semibold">Margin (%)</Text>
            <Text fontWeight="bold">
              {totalRevenue > 0
                ? ((grossProfit / totalRevenue) * 100).toFixed(2)
                : 0
              }%
            </Text>
          </Flex>
        </Card.Body>
      </Card.Root>

       <Card.Root mt={5}>
        <Card.Header>
          <Heading size="md">{t.sales_profit_summary.result_section}</Heading>
        </Card.Header>
        <Card.Body>
          <Flex justify="space-between">
            <Text>{t.sales_profit_summary.gross_profit} ({currency})</Text>
            <Text fontWeight="bold">
              {grossProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </Flex>

          <Flex justify="space-between">
            <Text>{t.sales_profit_summary.gross_profit_idr}</Text>
            <Text fontWeight="bold">{grossProfitIdr.toLocaleString()}</Text>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Flex justify="flex-end" mt={8} gap={3}>
        <Button variant="outline">{t.sales_profit_summary.cancel}</Button>
        <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.sales_profit_summary.save}</Button>
      </Flex>

    </SidebarWithHeader>
    
  );
}