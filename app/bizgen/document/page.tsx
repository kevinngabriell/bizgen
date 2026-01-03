"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  Button,
  Icon,
  Stack,
  Badge,
} from "@chakra-ui/react";
import { FiFileText, FiDownload, FiPlusCircle, FiFolder } from "react-icons/fi";

export default function Document() {
  return (
    <SidebarWithHeader username="kevin">
      <Flex direction="column" gap={6} p={4}>
        <Heading size="lg">Document Center</Heading>
        <Text color="gray.500">
          Manage, generate, and download all operational documents in one place.
        </Text>

        {/* QUICK ACTIONS */}
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Quick Actions</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Button
                // leftIcon={<Icon as={FiPlusCircle} />}
                bg={"#E77A1F"} color={"white"} cursor={"pointer"}
              >
                Generate New Document
              </Button>

              <Button
                // leftIcon={<Icon as={FiFileText} />}
                variant="outline"
                bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}
              >
                Upload External Document
              </Button>

              <Button
                // leftIcon={<Icon as={FiDownload} />}
                variant="outline"
                bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}
              >
                Bulk Export
              </Button>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* RECENT DOCUMENTS */}
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Recent Documents</Heading>
          </Card.Header>
          <Card.Body>
            <Stack gap={4}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="semibold">Purchase Order — #PO-00921</Text>
                  <Text fontSize="sm" color="gray.500">
                    Generated on 27 Dec 2025
                  </Text>
                </Box>
                <Badge colorScheme="blue">Generated</Badge>
              </Flex>

              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="semibold">Quotation — #QT-4412</Text>
                  <Text fontSize="sm" color="gray.500">
                    Uploaded on 25 Dec 2025
                  </Text>
                </Box>
                <Badge colorScheme="purple">Uploaded</Badge>
              </Flex>

              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="semibold">Shipping Invoice — #INV-7731</Text>
                  <Text fontSize="sm" color="gray.500">
                    Generated on 21 Dec 2025
                  </Text>
                </Box>
                <Badge colorScheme="green">Approved</Badge>
              </Flex>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* CATEGORIES */}
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Document Categories</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box
                border="1px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={4}
              >
                <Flex align="center" gap={3}>
                  <Icon as={FiFolder} />
                  <Box>
                    <Text fontWeight="semibold">Sales & Quotations</Text>
                    <Text fontSize="sm" color="gray.500">
                      Quotations, Proforma Invoices
                    </Text>
                  </Box>
                </Flex>
              </Box>

              <Box
                border="1px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={4}
              >
                <Flex align="center" gap={3}>
                  <Icon as={FiFolder} />
                  <Box>
                    <Text fontWeight="semibold">Purchase & Import</Text>
                    <Text fontSize="sm" color="gray.500">
                      Purchase Orders, Supplier Docs
                    </Text>
                  </Box>
                </Flex>
              </Box>

              <Box
                border="1px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={4}
              >
                <Flex align="center" gap={3}>
                  <Icon as={FiFolder} />
                  <Box>
                    <Text fontWeight="semibold">Logistics & Shipment</Text>
                    <Text fontSize="sm" color="gray.500">
                      BL, Packing List, Export Docs
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      </Flex>
    </SidebarWithHeader>
  );
}