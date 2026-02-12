"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Card, Flex, Heading, SimpleGrid, Text, Button, Badge, Icon,} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiFileText, FiCreditCard, FiDollarSign } from "react-icons/fi";

export default function Finance() {
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

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg">Finance Dashboard</Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
        <Card.Root variant="outline">
          <Card.Body>
            <Flex justify="space-between" align="center">
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500">Outstanding Receivables</Text>
                <Heading size="md">Rp 0</Heading>
              </Flex>
              <Icon as={FiTrendingUp} boxSize={6} color="green.400" />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root variant="outline">
          <Card.Body>
            <Flex justify="space-between" align="center">
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500">Outstanding Payables</Text>
                <Heading size="md">Rp 0</Heading>
              </Flex>
              <Icon as={FiTrendingDown} boxSize={6} color="red.400" />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root variant="outline">
          <Card.Body>
            <Flex justify="space-between" align="center">
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500">Cashflow Balance</Text>
                <Heading size="md">Rp 0</Heading>
              </Flex>
              <Icon as={FiDollarSign} boxSize={6} color="red.400" />
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Card.Root variant="outline" mt={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Accounts Receivable & Billing</Heading>
            <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create Invoice</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir={"column"}>
                    <Text fontSize="sm" color="gray.500">Customer Invoices</Text>
                    <Heading size="sm">0 Docs</Heading>
                  </Flex>
                  <Icon as={FiFileText} />
                </Flex>
                <Badge mt={2} colorScheme="yellow">Pending</Badge>
              </Card.Body>
            </Card.Root>

            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir={"column"}>
                    <Text fontSize="sm" color="gray.500">Unpaid Receivables</Text>
                    <Heading size="sm">Rp 0</Heading>
                  </Flex>
                  <Icon as={FiCreditCard} />
                </Flex>
                <Badge mt={2} colorScheme="yellow">Overdue 0</Badge>
              </Card.Body>
            </Card.Root>

            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir={"column"}>
                    <Text fontSize="sm" color="gray.500">Payment Received</Text>
                    <Heading size="sm">Rp 0</Heading>
                  </Flex>
                  <Icon as={FiDollarSign} />
                </Flex>
                <Badge mt={2} colorScheme="yellow">Today 0</Badge>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm">View All Receivables</Button>
        </Card.Footer>
      </Card.Root>

      <Card.Root variant="outline" mt={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">Accounts Payable & Vendor Bills</Heading>
            <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Add Vendor Bill</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Card.Root shadow="xs">
              <Card.Body>
                <Text fontSize="sm" color="gray.500">Outstanding Vendor Bills</Text>
                <Heading size="sm">Rp 0</Heading>
                <Badge mt={2} colorScheme="orange">Awaiting Payment</Badge>
              </Card.Body>
            </Card.Root>

            <Card.Root shadow="xs">
              <Card.Body>
                <Text fontSize="sm" color="gray.500">Approved Expenses</Text>
                <Heading size="sm">Rp 0</Heading>
                <Badge mt={2} colorScheme="blue">Processing</Badge>
              </Card.Body>
            </Card.Root>

            <Card.Root shadow="xs">
              <Card.Body>
                <Text fontSize="sm" color="gray.500">Paid Bills</Text>
                <Heading size="sm">Rp 0</Heading>
                <Badge mt={2} colorScheme="green">Completed</Badge>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm">View All Payables</Button>
        </Card.Footer>
      </Card.Root>

      <Card.Root variant="outline" mt={5}>
        <Card.Body>
          <Heading size="md" mb={2}>Cashflow & Ledger Overview</Heading>
          <Text fontSize="sm" color="gray.600">
              Cash In / Cash Out summary and general ledger mapping will appear here.
              (Next step: integrate with Job Costing & Shipment Profit reports.)
          </Text>
        </Card.Body>
      </Card.Root>

      <Card.Root variant="outline" mt={5}>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">Operational Income & Expenses</Heading>
              <Flex gap={2}>
                <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Add Income</Button>
                <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Add Expense</Button>
              </Flex>
            </Flex>
          </Card.Header>
          <Card.Body>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Card.Root shadow="xs">
                  <Card.Body>
                    <Flex justify="space-between" align="center">
                      <Flex flexDir={"column"}>
                        <Text fontSize="sm" color="gray.500">Total Income</Text>
                        <Heading size="sm">Rp 0</Heading>
                      </Flex>
                      <Icon as={FiTrendingUp} color="green.400" />
                    </Flex>
                    <Badge mt={2} colorScheme="green">This Month</Badge>
                  </Card.Body>
                </Card.Root>

                <Card.Root shadow="xs">
                  <Card.Body>
                    <Flex justify="space-between" align="center">
                      <Flex flexDir={"column"}>
                        <Text fontSize="sm" color="gray.500">Total Expenses</Text>
                        <Heading size="sm">Rp 0</Heading>
                      </Flex>
                      <Icon as={FiTrendingUp} color="red.400" />
                    </Flex>
                    <Badge mt={2} colorScheme="red">This Month</Badge>
                  </Card.Body>
                </Card.Root>

                <Card.Root shadow="xs">
                  <Card.Body>
                    <Flex justify="space-between" align="center">
                      <Flex flexDir={"column"}>
                        <Text fontSize="sm" color="gray.500">Net Operating Balance</Text>
                        <Heading size="sm">Rp 0</Heading>
                      </Flex>
                      <Icon as={FiTrendingUp} color="blue.400" />
                    </Flex>
                    <Badge mt={2} colorScheme="blue">Auto Calculated</Badge>
                  </Card.Body>
                </Card.Root>
              </SimpleGrid>
          </Card.Body>
          <Card.Footer>
            <Button variant="ghost" size="sm">View Income & Expense Ledger</Button>
          </Card.Footer>
        </Card.Root>
    </SidebarWithHeader>
  );
}