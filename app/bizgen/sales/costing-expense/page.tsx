'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Card, Flex, HStack, Heading, IconButton, Input, Stack, Text, Textarea, SimpleGrid, Separator } from '@chakra-ui/react';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { useRouter } from 'next/router';
import Loading from '@/components/loading';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
// import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

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
  const router = useRouter();

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
//   const toast = useToast();

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

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Stack gap={6}>
      <Heading size="lg">Costing &amp; Expense Capture (Actualization)</Heading>

      {/* Shipment Context Header */}
      <Card.Root variant="outline">
        <Card.Header>
          <Heading size="sm">Shipment Context</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Input placeholder="Job / Booking Number" value={shipmentInfo.joNumber} onChange={(e) => setShipmentInfo({ ...shipmentInfo, joNumber: e.target.value })}/>
            <Input placeholder="Customer" value={shipmentInfo.customer} onChange={(e) => setShipmentInfo({ ...shipmentInfo, customer: e.target.value })}/>
            {/* <Select
              placeholder="Mode"
              value={shipmentInfo.mode}
              onChange={(e) =>
                setShipmentInfo({ ...shipmentInfo, mode: e.target.value })
              }
            >
              <option value="SEA">Sea Freight</option>
              <option value="AIR">Air Freight</option>
              <option value="LAND">Land / Trucking</option>
            </Select> */}

            <Input placeholder="Origin Port / Location" value={shipmentInfo.origin} onChange={(e) => setShipmentInfo({ ...shipmentInfo, origin: e.target.value })} />
            <Input placeholder="Destination Port / Location" value={shipmentInfo.destination} onChange={(e) => setShipmentInfo({ ...shipmentInfo, destination: e.target.value })}/>
            <Textarea placeholder="Notes (optional)" rows={1}/>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      {/* Cost Items */}
      <Card.Root variant="outline">
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Actual Expense Items</Heading>
            <Button size="sm" variant="solid" onClick={handleAddRow} >
              Add Cost Item
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
                    <Text fontWeight="medium">Expense Line</Text>
                  </HStack>

                  {costItems.length > 1 && (
                    <IconButton aria-label="Remove row"
                    //   icon={<DeleteIcon />}
                      size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveRow(item.id)}/>
                  )}
                </Flex>

                <SimpleGrid column={{ base: '1fr', md: '1.2fr 1.8fr 1fr 0.7fr 1fr' }} gap={3}>
                  {/* <Select
                      placeholder="Cost Category"
                      value={item.category}
                      onChange={(e) =>
                        handleChange(item.id, 'category', e.target.value)
                      }
                    >
                      <option value="FREIGHT">Freight Charge</option>
                      <option value="TRUCKING">Trucking</option>
                      <option value="HANDLING">Port / Handling</option>
                      <option value="CUSTOMS">Customs & Clearance</option>
                      <option value="WAREHOUSE">Warehouse</option>
                      <option value="DOCS">Documentation</option>
                      <option value="OTHER">Other Cost</option>
                    </Select> */}
                  
                  <Input placeholder="Description" value={item.description} onChange={(e) => handleChange(item.id, 'description', e.target.value)}/>
                  <Input placeholder="Vendor / Supplier" value={item.vendor} onChange={(e) => handleChange(item.id, 'vendor', e.target.value)}/>

                  {/* <Select
                      value={item.currency}
                      onChange={(e) =>
                        handleChange(item.id, 'currency', e.target.value)
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="IDR">IDR</option>
                      <option value="SGD">SGD</option>
                      <option value="EUR">EUR</option>
                    </Select> */}

                    {/* <NumberInput.Root
                      min={0}
                      value={item.amount}
                      onChange={(_, val) =>
                        handleChange(item.id, 'amount', val || 0)
                      }
                    >
                      <NumberInputField placeholder="Amount" />
                    </NumberInput.Root> */}
                </SimpleGrid>

                <Box mt={3}>
                  <Textarea placeholder="Remarks / reference (optional)" value={item.remarks} onChange={(e) => handleChange(item.id, 'remarks', e.target.value)}/>
                </Box>
              </Box>
            ))}

            <Separator />

            <Flex justify="space-between">
              <Text fontWeight="semibold">Total Actual Cost</Text>
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
        <Button variant="outline" onClick={handleSaveDraft}>
          Save Draft
        </Button>
        <Button colorScheme="teal" onClick={handleFinalize}>
          Finalize Actualization
        </Button>
      </Flex>
    </Stack>
    </SidebarWithHeader>
    
  );
}