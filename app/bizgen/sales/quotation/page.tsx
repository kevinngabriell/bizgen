"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import {Button, Flex, Heading, HStack, Input, Select, SimpleGrid, Stack, Text, Textarea, Badge, IconButton, Separator, Card, Field, createListCollection, Portal,} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

interface QuotationItem {
  id: string;
  product: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export default function CreateQuotation() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

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
    
  const [items, setItems] = useState<QuotationItem[]>([
    { id: crypto.randomUUID(), product: "", description: "", qty: 1, unitPrice: 0 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), product: "", description: "", qty: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
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
      <Heading size="lg" mb={4}>{t.sales_quotation.title_create}</Heading>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />

      <Card.Root gap={6}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={9}>
            <Stack>
              <Text fontWeight="semibold" mb={3}>{t.sales_quotation.customer_information}</Text>
              <Field.Root>
                <Field.Label>{t.sales_quotation.customer_name}</Field.Label>
                <Input placeholder={t.sales_quotation.customer_name_placeholder} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_quotation.contact_person}</Field.Label>
                <Input placeholder={t.sales_quotation.contact_person_placeholder} />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_quotation.phone_number}</Field.Label>
                <Input placeholder={t.sales_quotation.phone_number_placeholder} />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_quotation.customer_address}</Field.Label>
                <Textarea placeholder={t.sales_quotation.customer_address_placeholder} />
              </Field.Root>
            </Stack>

            <Stack>
              <Text fontWeight="semibold" mb={3}>{t.sales_quotation.quotation_details}</Text>
              <Field.Root>
                <Field.Label>{t.sales_quotation.quotation_no}</Field.Label>
                <Input placeholder={t.sales_quotation.quotation_no_placeholder} />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_quotation.quotation_date}</Field.Label>
                <Input type="date" />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_quotation.currency}</Field.Label>
                <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_quotation.currency_placeholder} />
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
                <Field.Label>{t.sales_quotation.linked_inquiry}</Field.Label>
              </Field.Root>
            </Stack>
          </SimpleGrid>

          <Separator mt={7} mb={4}/>

          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold">{t.sales_quotation.quotation_items}</Text>
            <Button size="sm" bg="#E77A1F" color="white"  onClick={addItem}>{t.sales_quotation.add_item}</Button>
          </Flex>

          {items.map((item) => (
            <Card.Root key={item.id} p={4} mb={2}>
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                <Input placeholder={t.sales_quotation.product_service} />
                <Input placeholder={t.sales_quotation.description} />
                <Input type="number" placeholder={t.sales_quotation.quantity} />
                <Input type="number" placeholder={t.sales_quotation.unit_price} />
              </SimpleGrid>

              <HStack justify="space-between" mt={3}>
                <Badge colorScheme="purple">{t.sales_quotation.subtotal_auto}</Badge>
                <IconButton aria-label="Remove item" size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                  <FaTrash color="red"/>
                </IconButton>
              </HStack>
            </Card.Root>
          ))}

          <Separator mt={6} mb={6} />

          <Flex justify="flex-end" gap={3}>
            <Button variant="outline">{t.sales_quotation.cancel}</Button>
            <Button bg="#E77A1F" color="white" >{t.sales_quotation.save_draft}</Button>
            <Button bg="#E77A1F" color="white" >{t.sales_quotation.save_generate_pdf}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
  );
}