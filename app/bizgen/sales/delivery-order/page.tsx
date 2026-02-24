'use client';

import Loading from '@/components/loading';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import {Button, Card, Flex, Heading, Input, Text, Textarea, Field, Separator, NumberInput, SimpleGrid, createListCollection, Select, Portal} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

import { useEffect, useState } from 'react';

type LineItem = {
  description: string;
  qty: number;
  unitPriceForeign: number;
};

export default function CreateDeliveryOrderPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

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
    
  const [exchangeRate, setExchangeRate] = useState<number>(15500); // editable currency rate
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, unitPriceForeign: 0 },
  ]);

  const subtotalForeign = lineItems.reduce(
    (sum, li) => sum + li.qty * li.unitPriceForeign,
    0
  );
  const subtotalIDR = subtotalForeign * exchangeRate;

  const handleLineChange = (i: number, key: keyof LineItem, value: any) => {
    const draft = [...lineItems];
    (draft[i] as any)[key] = value;
    setLineItems(draft);
  };

  const addRow = () =>
    setLineItems([...lineItems, { description: '', qty: 1, unitPriceForeign: 0 }]);

  const removeRow = (i: number) =>
    setLineItems(lineItems.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    const payload = {
      docType: 'SPPB/Delivery Order',
      exchangeRate,
      items: lineItems,
      amounts: {
        subtotalForeign,
        subtotalIDR,
      },
    };
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>{t.sales_delivery_order.title_create}</Heading>

      <Card.Root>
        <Card.Header>
          <Heading size="sm">{t.sales_delivery_order.document_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={5}>
            <Field.Root>
              <Field.Label>{t.sales_delivery_order.do_number}</Field.Label>
              <Input placeholder={t.sales_delivery_order.do_number_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_delivery_order.issue_date}</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_delivery_order.reference}</Field.Label>
              <Input placeholder={t.sales_delivery_order.reference_placeholder} />
            </Field.Root>
          </SimpleGrid>
          

          <Separator mt={4} mb={4}/>

          <Heading size="sm" mb={3}>{t.sales_delivery_order.currency_exchange}</Heading>

          <SimpleGrid columns={{base: 1, md: 2}} gap={5}>
            <Field.Root>
              <Field.Label>{t.sales_delivery_order.currency}</Field.Label>
              <Select.Root w={"100%"} collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />    
                  <Select.Control>    
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_delivery_order.currency_placeholder} />
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

            <Field.Root>
              <Field.Label>{t.sales_delivery_order.exchange_rate}</Field.Label>
              <NumberInput.Root w={"100%"}>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
              <Text fontSize="sm" color="gray.500">{t.sales_delivery_order.exchange_rate_helper}</Text>
            </Field.Root>
          </SimpleGrid>
          

          <Separator mt={5} mb={5}/>

          <Heading size="sm" mb={4}>{t.sales_delivery_order.charges_items}</Heading>

          {lineItems.map((li, i) => (
            <Card.Root key={i} variant="subtle" mb={2}>
              <Card.Body gap={3}>
                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.description_label}</Field.Label>
                  <Input value={li.description} onChange={(e) => handleLineChange(i, 'description', e.target.value)} placeholder={t.sales_delivery_order.description_placeholder}/>
                </Field.Root>
                <Field.Root w={"100%"}>
                  <Field.Label>{t.sales_delivery_order.quantity}</Field.Label>
                  <NumberInput.Root w={"100%"}>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.unit_price}</Field.Label>
                  <NumberInput.Root w={"100%"}>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.line_total}</Field.Label>
                  <Input value={(li.qty * li.unitPriceForeign).toFixed(2)}/>
                </Field.Root>

                <Button borderColor={"red"} color="red" variant="ghost" onClick={() => removeRow(i)}>{t.sales_delivery_order.remove}</Button>
              </Card.Body>
            </Card.Root>
          ))}

          <Button mt={4} mb={4} onClick={addRow} variant="outline">{t.sales_delivery_order.add_item}</Button>

          <Separator mt={4} mb={4} />
          
          <Heading size="sm" mb={6}>{t.sales_delivery_order.totals}</Heading>

          <Flex flexDirection={"column"}>
            <>
              <Text fontWeight="md">Subtotal ({}): {subtotalForeign.toFixed(2)}</Text>
              <Text color="gray.600" fontSize="sm">{t.sales_delivery_order.subtotal_foreign}</Text>
            </>
            <>
              <Text fontWeight="medium" mt={4} mb={5}>{t.sales_delivery_order.subtotal_idr}: {subtotalIDR.toLocaleString('id-ID')}</Text>
            </>
          </Flex>

          <Separator mb={4} />

          <Field.Root>
            <Field.Label>{t.sales_delivery_order.remarks}</Field.Label>
            <Textarea placeholder={t.sales_delivery_order.remarks_placeholder} />
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={4}>
            <Button variant="ghost">{t.sales_delivery_order.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.sales_delivery_order.save}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}