'use client';

import Loading from '@/components/loading';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import {Button, Card, Flex, Heading, Input, Text, Textarea, Field, Separator, NumberInput, SimpleGrid, Box} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type DeliveryMode = "create" | "view" | "edit";

export default function CreateDeliveryOrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DeliveryOrderContent />
    </Suspense>
  );
}

function DeliveryOrderContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //retrieve rfq ID
  const searchParams = useSearchParams();
  const deliveryOrderID = searchParams.get("delivery_order_id");
  
  const [deliveryOrderStatus, setDeliveryOrderStatus] = useState<string>();
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  //set mode for create/update/view
  const [mode, setMode] = useState<DeliveryMode>("create");
  const isReadOnly = mode === "view" && deliveryOrderStatus !== "draft" && deliveryOrderStatus !== "rejected";
  
  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    init();
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
    
  const [lineItems, setLineItems] = useState([
    { id: Date.now(), itemId: '', description: '', qty: 1, uom: '' },
  ]);

  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const handleItemChange = (id: number, field: string, value: any) => {
    setLineItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const addRow = () =>
    setLineItems(prev => [
      ...prev, 
      {
        id: Date.now(),
        itemId: '',
        description: '',
        qty: 1,
        uom: ''
      }
  ]);

  const removeRow = (id: number) => {
    setLineItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev)
  }

  const handleSubmit = () => {
    const payload = {
      docType: 'SPPB/Delivery Order',
      customer_name: customerName,
      delivery_address: deliveryAddress,
      delivery_date: deliveryDate,
      items: lineItems,
    };
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg" mb={4}>{t.sales_delivery_order.title_create}</Heading>

      <Card.Root>
        <Card.Header>
          <Heading size="md">{t.sales_delivery_order.document_information}</Heading>
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

            <Field.Root>
              <Field.Label>Customer Name</Field.Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" />
            </Field.Root>

            <Field.Root>
              <Field.Label>Delivery Address</Field.Label>
              <Textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Enter delivery address" />
            </Field.Root>

            <Field.Root>
              <Field.Label>Delivery Date</Field.Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </Field.Root>
          </SimpleGrid>
          

          <Separator mt={5} mb={5}/>

          <Heading size="md" mb={4}>{t.sales_delivery_order.charges_items}</Heading>

          <Box overflowX="auto">
            {lineItems.map((li, i) => (
              <SimpleGrid key={i} templateColumns={"300px 200px 250px 400px 200px"} gap={6} mb={5}>
                <Field.Root>
                  <Field.Label>{t.sales_delivery_order.description_label}</Field.Label>
                  <Input value={li.description} onChange={(e) => handleItemChange(li.id, 'description', e.target.value)} placeholder={t.sales_delivery_order.description_placeholder}/>
                </Field.Root>
                <Field.Root w={"100%"}>
                  <Field.Label>{t.sales_delivery_order.quantity}</Field.Label>
                  <NumberInput.Root w={"100%"} value={String(li.qty)} onValueChange={(details) => handleItemChange(li.id, 'qty', Number(details.value))}>
                    <NumberInput.Control/>
                    <NumberInput.Input/>
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>UOM</Field.Label>
                  <Input value={li.uom} onChange={(e) => handleItemChange(li.id, 'uom', e.target.value)} placeholder="e.g. PCS / BOX"/>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Notes</Field.Label>
                  <Input value={li.uom} onChange={(e) => handleItemChange(li.id, 'uom', e.target.value)} placeholder="e.g. PCS / BOX"/>
                </Field.Root>
                <Button borderColor={"red"} color="red" variant="ghost" onClick={() => removeRow(li.id)}>{t.sales_delivery_order.remove}</Button>
              </SimpleGrid>
            ))}
          </Box>
          

          <Button mt={4} mb={4} onClick={addRow} variant="outline">{t.sales_delivery_order.add_item}</Button>

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