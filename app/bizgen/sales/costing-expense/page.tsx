'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Card, Flex, HStack, Heading, IconButton, Input, Stack, Text, Textarea, SimpleGrid, Separator, createListCollection, Select, Portal, Field } from '@chakra-ui/react';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import Loading from '@/components/loading';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { useRouter } from 'next/navigation';
import { getLang } from '@/lib/i18n';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { FaTrash } from 'react-icons/fa';
import { GetCustomerData } from '@/lib/master/customer';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import { GetSupplierData } from '@/lib/master/supplier';
import SupplierLookup from '@/components/lookup/SupplierLookup';

type CostItem = {
  id: string;
  category: string;
  description: string;
  vendor: string;
  currency: string;
  amount: number;
  remarks: string;
};

export default function CostingExpensePage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //to open customer popup
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);

  //shipment type option
  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((shipment) => ({
      label: `${shipment.ship_via_name}`,
      value: shipment.ship_via_id,
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

    const fetchPort = async () => {
      try {
        const portRes = await getAllPort(1, 1000);
        setPortOptions(portRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setPortOptions([]);
      }
    };

    fetchShipVia();
    fetchPort();
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

  const [costItems, setCostItems] = useState<CostItem[]>([
    {
      id: crypto.randomUUID(),
      category: '',
      description: '',
      vendor: '',
      currency: 'USD',
      amount: 0,
      remarks: '',
    },
  ]);

  const [shipmentInfo, setShipmentInfo] = useState({
    joNumber: '',
    customer: '',
    origin: '',
    destination: '',
    mode: '',
  });

  const handleAddRow = () => {
    setCostItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: '',
        description: '',
        vendor: '',
        currency: 'USD',
        amount: 0,
        remarks: '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setCostItems((prev) => prev.filter((c) => c.id !== id));
  };

  const handleChange = (id: string, field: keyof CostItem, value: any) => {
    setCostItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const totalAmount = costItems.reduce((sum, c) => sum + (c.amount || 0), 0);

  const handleSaveDraft = () => {
    // toast({
    //   title: 'Draft saved',
    //   description: 'Costing & expenses have been saved as draft.',
    //   status: 'success',
    // });
  };

  const handleFinalize = () => {
    // toast({
    //   title: 'Actualization submitted',
    //   description: 'Costs have been finalized for this shipment.',
    //   status: 'success',
    // });
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

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSupplierModalOpen(false);
  };

  if (loading) return <Loading/>;
  
  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Stack gap={6}>
        <Heading size="lg">{t.sales_costing_expense.title}</Heading>

        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        <SupplierLookup isOpen={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} onChoose={handleChooseSupplier} />

        {/* Shipment Context Header */}
        <Card.Root variant="outline">
          <Card.Header>
            <Heading size="md">{t.sales_costing_expense.shipment_context}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Field.Label>{t.sales_costing_expense.job_booking_number}</Field.Label>
                <Input placeholder={t.sales_costing_expense.job_booking_number_placeholder} value={shipmentInfo.joNumber} onChange={(e) => setShipmentInfo({ ...shipmentInfo, joNumber: e.target.value })}/>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_costing_expense.customer}</Field.Label>
                <Input placeholder={t.sales_costing_expense.customer_placeholder} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_costing_expense.shipment_type}</Field.Label>
                <Select.Root collection={shipmentTypeCollection} size="sm">
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_costing_expense.shipment_type_placeholder} />
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
                <Field.Label>{t.sales_costing_expense.origin_port}</Field.Label>
                <Select.Root collection={portCollection} value={originSelected ? [originSelected] : []} onValueChange={(details) => setOriginSelected(details.value[0])} size="sm" width="100%">
                  <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.sales_costing_expense.origin_port_placeholder} />
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
              <Field.Label>{t.sales_costing_expense.destination_port}</Field.Label>
              <Select.Root collection={portCollection} value={destinationSelected ? [destinationSelected] : []} onValueChange={(details) => setDestinationSelected(details.value[0])} size="sm" width="100%">
                    <Select.HiddenSelect />
                    <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_costing_expense.destination_port_placeholder} />
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
              <Field.Label>{t.sales_costing_expense.notes_optional}</Field.Label>
              <Textarea placeholder={t.sales_costing_expense.notes_optional_placeholder} rows={1}/>
            </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

      {/* Cost Items */}
      <Card.Root variant="outline">
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.sales_costing_expense.actual_expense_items}</Heading>
            <Button size="sm" variant="solid" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleAddRow} >
              {t.sales_costing_expense.add_cost_item}
            </Button>
          </Flex>
        </Card.Header>

        <Card.Body>
          <Stack gap={4}>
            {costItems.map((item, idx) => (
              <Box key={item.id} borderWidth="1px" borderRadius="md" p={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <HStack>
                    {/* <Tag size="sm" colorScheme="gray">
                      <TagLabel>#{idx + 1}</TagLabel>
                    </Tag> */}
                    <Text fontWeight="medium">{t.sales_costing_expense.expense_line}</Text>
                  </HStack>

                  {costItems.length > 1 && (
                    <IconButton aria-label="Remove row" size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveRow(item.id)}>
                      <FaTrash color='red'/>
                    </IconButton>
                  )}
                </Flex>

                <SimpleGrid column={{ base: '1fr', md: '1.2fr 1.8fr 1fr 0.7fr 1fr' }} gap={3}>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.cost_category}</Field.Label>
                    <Select.Root collection={costCategoryOptions} size="sm">
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.sales_costing_expense.cost_category_placeholder} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {costCategoryOptions.items.map((costcategory) => (
                              <Select.Item item={costcategory} key={costcategory.value}>{costcategory.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.cost_description}</Field.Label>
                    <Input placeholder={t.sales_costing_expense.cost_description_placeholder} value={item.description} onChange={(e) => handleChange(item.id, 'description', e.target.value)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.supplier}</Field.Label>
                    <Input placeholder={t.sales_costing_expense.supplier_placeholder} readOnly cursor="pointer" onClick={() => setSupplierModalOpen(true)}/>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.currency}</Field.Label>
                    <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setSelected(details.value[0])} size="sm" width="100%">
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.sales_costing_expense.currency_placeholder} />
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

                </SimpleGrid>

                <Box mt={3}>
                  <Field.Root>
                    <Field.Label>{t.sales_costing_expense.remarks_reference}</Field.Label>
                    <Textarea placeholder={t.sales_costing_expense.remarks_reference_placeholder} value={item.remarks} onChange={(e) => handleChange(item.id, 'remarks', e.target.value)}/>
                  </Field.Root>
                  
                </Box>
              </Box>
            ))}

            <Separator />

            <Flex justify="space-between">
              <Text fontWeight="semibold">{t.sales_costing_expense.total_actual_cost}</Text>
              <Text fontWeight="bold">
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {costItems[0]?.currency || ''}
              </Text>
            </Flex>
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* Actions */}
      <Flex justify="flex-end" gap={3}>
        <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={handleSaveDraft}>
          {t.sales_costing_expense.save_draft}
        </Button>
        <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleFinalize}>
          {t.sales_costing_expense.finalize_actualization}
        </Button>
      </Flex>
    </Stack>
    </SidebarWithHeader>
    
  );
}

const costCategoryOptions = createListCollection({
  items: [
    { label: "Freight Charge", value: "freight-charge" },
    { label: "Trucking", value: "trucking" },
    { label: "Port / Handling", value: "port-handling" },
    { label: "Customs & Clearance", value: "custom-clearance" },
    { label: "Warehouse", value: "warehouse" },
    { label: "Documentation", value: "documentation" },
    { label: "Other Cost", value: "other-cost" }
  ],
})
