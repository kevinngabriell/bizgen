

'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Field,
  Grid,
  GridItem,
  HStack,
  Heading,
  Input,
  Select,
  Separator,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';

export default function CreateSalesOrderPage() {
  const router = useRouter();
//   const toast = useToast();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: integrate with API
      await new Promise((r) => setTimeout(r, 800));

    //   toast({
    //     title: 'Sales Order created',
    //     status: 'success',
    //     position: 'top-right',
    //   });

      router.push('/bizgen/sales/sales-order');
    } catch (err) {
    //   toast({
    //     title: 'Failed to create Sales Order',
    //     status: 'error',
    //     position: 'top-right',
    //   });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarWithHeader username='--'>
        <Box p={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Create Sales Order</Heading>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </HStack>

      <Card.Root>
        <Card.Header fontWeight="semibold">Order Information</Card.Header>
        <Separator />
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={6}>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <GridItem>
                  <Field.Root>
                    <Field.Label>Customer</Field.Label>
                    <Input placeholder="Select / enter customer name" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Inquiry / Quotation Ref</Field.Label>
                    <Input placeholder="Reference number (optional)" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Order Date</Field.Label>
                    <Input type="date" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Sales Person</Field.Label>
                    <Input placeholder="Assign sales person" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Service Type</Field.Label>
                    {/* <Select placeholder="Select service">
                      <option>Export</option>
                      <option>Import</option>
                      <option>Domestic</option>
                    </Select> */}
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Shipment Mode</Field.Label>
                    {/* <Select placeholder="Select mode">
                      <option>Sea Freight</option>
                      <option>Air Freight</option>
                      <option>Land / Trucking</option>
                    </Select> */}
                  </Field.Root>
                </GridItem>
              </Grid>

              <Separator />

              <Heading size="sm">Origin &amp; Destination</Heading>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <GridItem>
                  <Field.Root>
                    <Field.Label>Origin Country / Port</Field.Label>
                    <Input placeholder="e.g., Shanghai, CN" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Destination Country / Port</Field.Label>
                    <Input placeholder="e.g., Jakarta, ID" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>ETA / ETD</Field.Label>
                    <Input type="date" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Incoterm</Field.Label>
                    {/* <Select placeholder="Select incoterm">
                      <option>FOB</option>
                      <option>CIF</option>
                      <option>EXW</option>
                      <option>DDP</option>
                    </Select> */}
                  </Field.Root>
                </GridItem>
              </Grid>

              <Separator />

              <Heading size="sm">Cargo Details</Heading>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <GridItem>
                  <Field.Root>
                    <Field.Label>Commodity</Field.Label>
                    <Input placeholder="Cargo / commodity description" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>HS Code (optional)</Field.Label>
                    <Input placeholder="e.g., 0901.21.00" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Quantity / Packaging</Field.Label>
                    <Input placeholder="e.g., 120 Cartons" />
                  </Field.Root>
                </GridItem>

                <GridItem>
                  <Field.Root>
                    <Field.Label>Weight &amp; Volume</Field.Label>
                    <Input placeholder="e.g., 2,450 KG | 12.4 CBM" />
                  </Field.Root>
                </GridItem>
              </Grid>

              <Field.Root>
                <Field.Label>Remarks / Special Instruction</Field.Label>
                <Textarea rows={4} placeholder="Notes for operations / customer" />
              </Field.Root>

              <HStack justify="flex-end" gap={3}>
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button colorScheme="blue" type="submit">
                  Save Sales Order
                </Button>
              </HStack>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
    </SidebarWithHeader>
    
  );
}