"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  Button,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { FiTrendingUp, FiTrendingDown, FiFileText, FiCreditCard, FiDollarSign } from "react-icons/fi";

export default function Finance() {
  return (
    <SidebarWithHeader username="kevin">
      <Flex direction="column" p={6} gap={6}>
        <Heading size="lg">Finance Dashboard</Heading>

        {/* KPI SUMMARY */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          <Card.Root variant="outline">
            <Card.Body>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" color="gray.500">Outstanding Receivables</Text>
                  <Heading size="md">Rp 0</Heading>
                </Box>
                <Icon as={FiTrendingUp} boxSize={6} color="green.400" />
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="outline">
            <Card.Body>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" color="gray.500">Outstanding Payables</Text>
                  <Heading size="md">Rp 0</Heading>
                </Box>
                <Icon as={FiTrendingDown} boxSize={6} color="red.400" />
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="outline">
            <Card.Body>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" color="gray.500">Cashflow Balance</Text>
                  <Heading size="md">Rp 0</Heading>
                </Box>
                <Icon as={FiDollarSign} boxSize={6} color="blue.400" />
              </Flex>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* AR & BILLING */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">Accounts Receivable & Billing</Heading>
              <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create Invoice</Button>
            </Flex>
          </Card.Header>
          {/* <Divider /> */}
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Card.Root shadow="xs">
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Customer Invoices</Text>
                      <Heading size="sm">0 Docs</Heading>
                    </Box>
                    <Icon as={FiFileText} />
                  </Flex>
                  <Badge mt={2} colorScheme="yellow">Pending</Badge>
                </Card.Body>
              </Card.Root>

              <Card.Root shadow="xs">
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Unpaid Receivables</Text>
                      <Heading size="sm">Rp 0</Heading>
                    </Box>
                    <Icon as={FiCreditCard} />
                  </Flex>
                  <Badge mt={2} colorScheme="red">Overdue 0</Badge>
                </Card.Body>
              </Card.Root>

              <Card.Root shadow="xs">
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Payment Received</Text>
                      <Heading size="sm">Rp 0</Heading>
                    </Box>
                    <Icon as={FiDollarSign} />
                  </Flex>
                  <Badge mt={2} colorScheme="green">Today 0</Badge>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          </Card.Body>
          <CardFooter>
            <Button variant="ghost" size="sm">View All Receivables</Button>
          </CardFooter>
        </Card.Root>

        {/* AP & VENDOR */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">Accounts Payable & Vendor Bills</Heading>
              <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Add Vendor Bill</Button>
            </Flex>
          </Card.Header>
          {/* <Divider /> */}
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

        {/* CASHFLOW */}
        <Card.Root variant="outline">
          <Card.Header>
            <Heading size="md">Cashflow & Ledger Overview</Heading>
          </Card.Header>
          {/* <Divider /> */}
          <Card.Body>
            <Text fontSize="sm" color="gray.600">
              Cash In / Cash Out summary and general ledger mapping will appear here.
              (Next step: integrate with Job Costing & Shipment Profit reports.)
            </Text>
          </Card.Body>
        </Card.Root>

        {/* OPERATIONAL INCOME & EXPENSES */}
        <Card.Root variant="outline">
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
                    <Box>
                      <Text fontSize="sm" color="gray.500">Total Income</Text>
                      <Heading size="sm">Rp 0</Heading>
                    </Box>
                    <Icon as={FiTrendingUp} color="green.400" />
                  </Flex>
                  <Badge mt={2} colorScheme="green">This Month</Badge>
                </Card.Body>
              </Card.Root>

              <Card.Root shadow="xs">
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Total Expenses</Text>
                      <Heading size="sm">Rp 0</Heading>
                    </Box>
                    <Icon as={FiTrendingDown} color="red.400" />
                  </Flex>
                  <Badge mt={2} colorScheme="red">This Month</Badge>
                </Card.Body>
              </Card.Root>

              <Card.Root shadow="xs">
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontSize="sm" color="gray.500">Net Operating Balance</Text>
                      <Heading size="sm">Rp 0</Heading>
                    </Box>
                    <Icon as={FiDollarSign} color="blue.400" />
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
      </Flex>
    </SidebarWithHeader>
  );
}