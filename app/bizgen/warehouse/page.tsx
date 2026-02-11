"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Flex, Heading, Text, Badge, Button, Icon, Tabs, SimpleGrid, Card } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FiArrowDownCircle, FiArrowUpCircle, FiPackage, FiActivity, FiPlus, FiTruck,} from "react-icons/fi";

export default function Warehouse() {
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
      <Heading>Warehouse</Heading>

      <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mt={3}>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"} alignItems={"center"}>
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500" mb={1}>Total SKUs</Text>
                <Heading size="md">128</Heading>
              </Flex>
              <Icon as={FiPackage} boxSize={6} />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"} alignItems={"center"}>
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500" mb={1}>On‑Hand Stock</Text>
                <Heading size="md">4,912 pcs</Heading>
              </Flex>
              <Icon as={FiTruck} boxSize={6} />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"} alignItems={"center"}>
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500" mb={1}>Pending Movements</Text>
                <Heading size="md">7</Heading>
              </Flex>
              <Icon as={FiActivity} boxSize={6} />
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <SimpleGrid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap={6} mt={4}>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"}>
              <Heading size="md">Stock Movements</Heading>
              <Flex gap={2}>
                <Button size="sm" variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>Stock In</Button>
                <Button size="sm" variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>Stock Out</Button>
                <Button size="sm" variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>Sample Out</Button>
              </Flex>
            </Flex>

            <Tabs.Root size="sm" colorScheme="blue" defaultValue="inbound">
              <Tabs.List>
                <Tabs.Trigger value="inbound">Inbound</Tabs.Trigger>
                <Tabs.Trigger value="outbound">Outbound</Tabs.Trigger>
                <Tabs.Trigger value="sample">Sample</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="inbound">
                <Flex flexDir={"column"} gap={3}>
                  <MovementRow type="in" code="GRN-24015" desc="Arrival — Container #A781" qty="+ 1,200 pcs" time="Today • 10:24"/>
                  <MovementRow type="in" code="GRN-24014" desc="Inbound — PO 88219" qty="+ 540 pcs" time="Yesterday • 16:02"/>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="outbound">
                <MovementRow type="out" code="DLV-33910" desc="Outbound to Customer — SO 4411" qty="- 300 pcs" time="Today • 10:24"/>
              </Tabs.Content>

              <Tabs.Content value="sample">
                <MovementRow type="sample" code="SMP-88412" desc="Product Sample Request" qty="- 12 pcs" time="Today • 10:24"/>
              </Tabs.Content>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>

        <Card.Root>
          <Card.Body>
            <Heading size="md" mb={2}>Recent Warehouse Activity</Heading>
            <Flex flexDir={"column"} gap={4} mt={3}> 
              <ActivityItem label="Stock checked & reconciled" meta="By Kevin • 10:02"/>
              <ActivityItem label="Cycle count — Aisle B3" meta="Yesterday • 17:44"/>
              <ActivityItem label="Sample dispatch created" meta="2 days ago"/>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </SidebarWithHeader>
  );
}

/* Helper components */

function MovementRow({type, code, desc, qty, time}: {type: "in" | "out" | "sample"; code: string; desc: string; qty: string; time: string;}) {
  const color = type === "in" ? "green" : type === "out" ? "red" : "purple";
  const icon = type === "in" ? FiArrowDownCircle : type === "out" ? FiArrowUpCircle : FiPlus;

  return (
    <Card.Root>
      <Card.Body>
        <Flex justify="space-between">
          <Flex alignItems={"center"} gap={3}>
            <Icon as={icon} color={`${color}.400`} />
            <Flex flexDir={"column"}>
              <Text fontWeight="semibold">{code}</Text>
              <Text fontSize="sm" color="gray.500">{desc}</Text>
            </Flex>
          </Flex>
          <Flex justify={"end"} flexDir={"column"} gap={1}>
            <Badge color={color}>{qty}</Badge>
            <Text fontSize="xs" color="gray.500">{time}</Text>
          </Flex>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

function ActivityItem({label, meta}: {label: string; meta: string;}) {
  return (
    <Card.Root>
      <Card.Body>
        <Text fontSize={"sm"}>{label}</Text>
        <Text fontSize="xs" color="gray.500">{meta}</Text>
      </Card.Body>
    </Card.Root>
  );
}