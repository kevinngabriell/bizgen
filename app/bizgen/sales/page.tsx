"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Button, Card, Flex, Heading, Text, SimpleGrid, Badge, Icon } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiFolder, FiFileText, FiCheckSquare, FiClipboard, FiDollarSign, FiShoppingCart, FiTruck, FiTrendingUp } from "react-icons/fi";

export default function Sales (){
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
  
  const handleDirectToDetailInquiry = () => {
    router.push('/bizgen/sales/inquiry');
  }

  const handleDirectToDetailQuotation = () => {
    router.push('/bizgen/sales/quotation');
  }

  const handleDirectToBooking = () => {
    router.push('/bizgen/sales/booking-confirmation');
  }

  const handleDirectToShipment = () => {
    router.push('/bizgen/sales/shipment-process');
  }

  const handleDriectToCostingExpense = () => {
    router.push('/bizgen/sales/costing-expense');
  }

  const handleDirectToSalesOrder = () => {
    router.push('/bizgen/sales/sales-order');
  }


    return (
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
          <Flex gap={2} mb="6" mt="2" alignItems="center" justifyContent="space-between">
            <Heading>Sales Module</Heading>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>+ Create New</Button>
          </Flex>

          <Text fontSize="sm" color="gray.500" mb="8">
            Manage the full commercial lifecycle — from Inquiry to Invoice — with a guided, step‑by‑step workflow.
          </Text>

          <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} gap={8}>
            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiFolder} />
                  <Heading size="md" flex="1">Inquiry / RFQ</Heading>
                  <Badge colorScheme="purple">Start here</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Capture customer requests, shipment details, and service scope before pricing.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDetailInquiry} >Create</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiFileText} />
                  <Heading size="md" flex="1">Quotation</Heading>
                  <Badge colorScheme="gray">Pricing</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Build cost structure, margin, and generate customer quotation.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDetailQuotation}>Create</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiCheckSquare} />
                  <Heading size="md" flex="1">Booking Confirmation / Job Order</Heading>
                  <Badge colorScheme="green">Confirmed</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Convert approved quotes into operational jobs with unique job numbers.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToBooking}>Create</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiClipboard} />
                  <Heading size="md" flex="1">Shipment Processing & Documents</Heading>
                  <Badge colorScheme="blue">Operations</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Manage BL, DO, manifest, customs docs, and shipment milestones.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToShipment}>Update</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiDollarSign} />
                  <Heading size="md" flex="1">Costing & Expense Capture (Actualization)</Heading>
                  <Badge colorScheme="orange">Finance Sync</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Record real operational costs and compare vs quotation margin.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDriectToCostingExpense}>Record</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiShoppingCart} />
                  <Heading size="md" flex="1">Sales Order</Heading>
                  <Badge colorScheme="teal">Commercial</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Convert job operational results into billable services.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToSalesOrder}>Generate</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiTruck} />
                  <Heading size="md" flex="1">Delivery Order / SPPB</Heading>
                  <Badge colorScheme="cyan">Release</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Issue delivery / customs release documents when cargo is cleared.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Issue</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiTrendingUp} />
                  <Heading size="md" flex="1">Profit Summary</Heading>
                  <Badge colorScheme="pink">Analysis</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  View job profitability — revenue vs actual cost breakdown.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>View</Button>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiFileText} />
                  <Heading size="md" flex="1">Invoice</Heading>
                  <Badge colorScheme="purple">Billing</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">
                  Generate invoice from Sales Order with tax & multi‑currency support.
                </Text>
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                    Last 3 records
                  </Text>
                  <Flex direction="column" gap={1}>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #1</Text>
                      <Badge colorScheme="gray" variant="subtle">Today</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #2</Text>
                      <Badge colorScheme="gray" variant="subtle">Yesterday</Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="xs" color="gray.600" maxLines={1}>Sample item #3</Text>
                      <Badge colorScheme="gray" variant="subtle">2d ago</Badge>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex justify="space-between">
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>See All</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
      </SidebarWithHeader>
    );
}