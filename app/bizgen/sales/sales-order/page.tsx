'use client';

import { useEffect, useState } from 'react';
import { Button, Card, createListCollection, Field, Flex, Heading, Input, Portal, Select, Separator, SimpleGrid, Textarea } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import Loading from '@/components/loading';
import { getLang } from '@/lib/i18n';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { GetCustomerData } from '@/lib/master/customer';
import CustomerLookup from '@/components/lookup/CustomerLookup';

export default function CreateSalesOrderPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

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

  //set term selection
  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
  
  const termCollection = createListCollection({
    items: termOptions.map((term) => ({
      label: `${term.term_name}`,
      value: term.term_id,
    })),
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: integrate with API
      await new Promise((r) => setTimeout(r, 800));

      router.push('/bizgen/sales/sales-order');
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };

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

    const fetchPort = async () => {
      try {
        const portRes = await getAllPort(1, 1000);
        setPortOptions(portRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setPortOptions([]);
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

    fetchShipVia();
    fetchPort();
    fetchTerm();
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
      <Heading size="lg">{t.sales_order.title_create}</Heading>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        
      <Card.Root mt={4}>
        <Card.Header>
          <Heading>{t.sales_order.order_information}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6} mb={8}>
            <Field.Root>
              <Field.Label>{t.sales_order.customer}</Field.Label>
                <Input placeholder={t.sales_order.customer_placeholder} readOnly cursor="pointer" onClick={() => setCustomerModalOpen(true)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.inquiry_quotation_ref}</Field.Label>
              <Input placeholder={t.sales_order.inquiry_quotation_ref_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.order_date}</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.sales_person}</Field.Label>
              <Input placeholder={t.sales_order.sales_person_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.service_type}</Field.Label>
                <Select.Root collection={jobTypeOptions} size="sm">
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
                <Select.Root collection={shipmentTypeCollection} size="sm">
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
          </SimpleGrid>

          <Separator />

          <Heading size="md" mt={5} mb={3}>{t.sales_order.origin_destination}</Heading>
          
          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6} mb={6}>
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
            <Field.Root>
              <Field.Label>{t.sales_order.eta_etd}</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.incoterm}</Field.Label>
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

          <Separator />

          <Heading size="md" mt={6} mb={4}>{t.sales_order.cargo_details}</Heading>

          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
            <Field.Root>
              <Field.Label>{t.sales_order.commodity}</Field.Label>
              <Input placeholder={t.sales_order.commodity_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.hs_code}</Field.Label>
              <Input placeholder={t.sales_order.hs_code_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.quantity_packaging}</Field.Label>
              <Input placeholder={t.sales_order.quantity_packaging_placeholder} />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.sales_order.weight_volume}</Field.Label>
              <Input placeholder={t.sales_order.weight_volume_placeholder} />
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={4}>
            <Field.Label>{t.sales_order.remarks}</Field.Label>
            <Textarea rows={4} placeholder={t.sales_order.remarks_placeholder} />
          </Field.Root>

          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}  onClick={() => router.back()}>{t.sales_order.cancel}</Button>
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