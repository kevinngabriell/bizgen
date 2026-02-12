"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import {Button, Flex, Heading, Input, SimpleGrid, Text, Separator, NumberInput, Badge, Card, Field} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

type LineItem = {
  id: string;
  label: string;
  currency: string;
  amount: number;
};

export default function CreateProfitSummaryPage() {
  const [referenceNo, setReferenceNo] = useState("");
  const [jobOrderNo, setJobOrderNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(15000);

  const [revenue, setRevenue] = useState<LineItem[]>([]);
  const [costs, setCosts] = useState<LineItem[]>([]);

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

  const addRevenue = () => {
    setRevenue([
      ...revenue,
      { id: crypto.randomUUID(), label: "", currency, amount: 0 },
    ]);
  };

  const addCost = () => {
    setCosts([
      ...costs,
      { id: crypto.randomUUID(), label: "", currency, amount: 0 },
    ]);
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

  const subtotal = (list: LineItem[]) =>
    list.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const revenueTotal = subtotal(revenue);
  const costTotal = subtotal(costs);
  const grossProfit = revenueTotal - costTotal;
  const grossProfitIdr = grossProfit * exchangeRate;

  const handleSubmit = () => {
    const payload = {
      reference_no: referenceNo,
      job_order_no: jobOrderNo,
      customer,
      currency,
      exchange_rate: exchangeRate,
      revenue_items: revenue,
      cost_items: costs,
      revenue_total: revenueTotal,
      cost_total: costTotal,
      gross_profit: grossProfit,
      gross_profit_idr: grossProfitIdr,
    };

    console.log("SUBMIT PROFIT SUMMARY", payload);
    // TODO: POST to API endpoint when ready
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Create Profit Summary</Heading>
        <Badge colorScheme="blue">Sales &amp; Costing</Badge>
      </Flex>

      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="sm">Header Information</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field.Root mb={2}>
              <Field.Label>Reference No</Field.Label>
              <Input placeholder="PS-2026-001" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}/>
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>Job Order / Booking No</Field.Label>
              <Input placeholder="JO-2026-0012" value={jobOrderNo} onChange={(e) => setJobOrderNo(e.target.value)}/>
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>Customer</Field.Label>
              <Input placeholder="Customer Name" value={customer} onChange={(e) => setCustomer(e.target.value)}/>
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>Currency</Field.Label>
              {/* <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="IDR">IDR</option>
                </Select> */}
            </Field.Root>
            <Field.Root mb={2}>
              <Field.Label>Exchange Rate to IDR</Field.Label>
              <NumberInput.Root>
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
            <Heading size="sm">Revenue</Heading>
            <Button size="sm" onClick={addRevenue}>+ Add Revenue Line</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {revenue.map((item) => (
            <Flex key={item.id} gap={3}>
              <Input placeholder="Description" value={item.label} onChange={(e) => updateItem(revenue, setRevenue, item.id, "label", e.target.value)}/>
              {/* Harusnya selection untuk currency */}
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Flex>
          ))}
          <Separator />
          <Flex justify="space-between">
            <Text fontWeight="semibold">Revenue Total ({currency})</Text>
            <Text fontWeight="bold">{revenueTotal.toLocaleString()}</Text>
          </Flex>
        </Card.Body>
      </Card.Root>

       <Card.Root mt={5}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="sm">Costs / Expenses</Heading>
            <Button size="sm" onClick={addCost}>+ Add Cost Line</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          {costs.map((item) => (
            <Flex key={item.id} gap={3}>
              <Input placeholder="Description" value={item.label} onChange={(e) => updateItem(costs, setCosts, item.id, "label", e.target.value)}/>
              {/* Harusnya selection untuk currency */}
              <NumberInput.Root>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Flex>
          ))}
          <Separator />
          <Flex justify="space-between">
            <Text fontWeight="semibold">Cost Total ({currency})</Text>
            <Text fontWeight="bold">{costTotal.toLocaleString()}</Text>
          </Flex>
        </Card.Body>
       </Card.Root>

       <Card.Root mt={5}>
        <Card.Header>
          <Heading size="sm">Profit Summary Result</Heading>
        </Card.Header>
        <Card.Body>
          <Flex justify="space-between">
            <Text>Gross Profit ({currency})</Text>
            <Text fontWeight="bold">
              {grossProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </Flex>

          <Flex justify="space-between">
            <Text>Gross Profit (IDR)</Text>
            <Text fontWeight="bold">{grossProfitIdr.toLocaleString()}</Text>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Flex justify="flex-end" mt={8} gap={3}>
        <Button variant="outline">Cancel</Button>
        <Button colorScheme="green" onClick={handleSubmit}>Save Profit Summary</Button>
      </Flex>

    </SidebarWithHeader>
    
  );
}