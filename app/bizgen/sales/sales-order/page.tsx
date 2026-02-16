'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Field, Flex, Heading, Input, Separator, SimpleGrid, Textarea } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import Loading from '@/components/loading';

export default function CreateSalesOrderPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const router = useRouter();

  const [loading, setLoading] = useState(false);

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

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg">Create Sales Order</Heading>

      <Card.Root mt={4}>
        <Card.Header>
          <Heading>Order Information</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6} mb={8}>
            <Field.Root>
              <Field.Label>Customer</Field.Label>
              <Input placeholder="Select / enter customer name" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Inquiry / Quotation Ref</Field.Label>
              <Input placeholder="Reference number (optional)" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Order Date</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Sales Person</Field.Label>
              <Input placeholder="Assign sales person" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Service Type</Field.Label>
                {/* <Select placeholder="Select service">
                <option>Export</option>
                <option>Import</option>
                <option>Domestic</option>
                </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Shipment Mode</Field.Label>
                {/* <Select placeholder="Select mode">
                <option>Sea Freight</option>
                <option>Air Freight</option>
                <option>Land / Trucking</option>
                </Select> */}
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Heading size="sm">Origin &amp; Destination</Heading>
          
          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
            <Field.Root>
              <Field.Label>Origin Country / Port</Field.Label>
              <Input placeholder="e.g., Shanghai, CN" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Destination Country / Port</Field.Label>
              <Input placeholder="e.g., Jakarta, ID" />
            </Field.Root>
            <Field.Root>
              <Field.Label>ETA / ETD</Field.Label>
              <Input type="date" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Incoterm</Field.Label>
                    {/* <Select placeholder="Select incoterm">
                      <option>FOB</option>
                      <option>CIF</option>
                      <option>EXW</option>
                      <option>DDP</option>
                    </Select> */}
            </Field.Root>
          </SimpleGrid>

          <Separator />

          <Heading size="sm">Cargo Details</Heading>

          <SimpleGrid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
            <Field.Root>
              <Field.Label>Commodity</Field.Label>
              <Input placeholder="Cargo / commodity description" />
            </Field.Root>
            <Field.Root>
              <Field.Label>HS Code (optional)</Field.Label>
              <Input placeholder="e.g., 0901.21.00" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Quantity / Packaging</Field.Label>
              <Input placeholder="e.g., 120 Cartons" />
            </Field.Root>
            <Field.Root>
              <Field.Label>Weight &amp; Volume</Field.Label>
              <Input placeholder="e.g., 2,450 KG | 12.4 CBM" />
            </Field.Root>
          </SimpleGrid>

          <Field.Root>
            <Field.Label>Remarks / Special Instruction</Field.Label>
            <Textarea rows={4} placeholder="Notes for operations / customer" />
          </Field.Root>

          <Flex justify="flex-end" gap={3}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}  onClick={() => router.back()}>Cancel</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} type="submit">Save Sales Order</Button>
          </Flex>

        </Card.Body>
      </Card.Root>
      
    </SidebarWithHeader>
    
  );
}