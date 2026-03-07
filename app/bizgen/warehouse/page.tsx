"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getWarehouseStockSummary, WarehouseSummary } from "@/lib/warehouse/warehouse";
import { Flex, Heading, Text, Badge, Button, Icon, Tabs, SimpleGrid, Card } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiArrowDownCircle, FiArrowUpCircle, FiPackage, FiActivity, FiPlus, FiTruck,} from "react-icons/fi";

export default function Warehouse() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);
    
  const [warehouseSummary, setWarehouseSummary] = useState<WarehouseSummary | null>(null);
  
  const router = useRouter();

  //alert success or failed
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);


  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    const warehouseSummaryRes = await getWarehouseStockSummary();
    setWarehouseSummary(warehouseSummaryRes.data || null);

    setLoading(false);
  }

  const handleDirectToStockIn = () => {
    router.push('/bizgen/warehouse/stock-in');
  }

  const handleDirectToStockOut = () => {
    router.push('/bizgen/warehouse/stock-out');
  }

  const handleDirectToStockSample = () => {
    router.push('/bizgen/warehouse/sample');
  }

  // ===== Reporting Navigation =====
  const handleWeeklyStockReport = () => {
    try {
      setLoading(true);

      setIsSuccess(true);
      setTitlePopup("Success");
      setMessagePopup("Weekly report successfully downloaded !!");
      setShowAlert(true);
    } catch (e: any){
      setIsSuccess(false);
      setTitlePopup("Error");
      setMessagePopup(e.message || "Failed to download weekly report");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStockReportByProduct = () => {
    router.push('/bizgen/warehouse/stock-report');
  };

  const handleStockSearchPage = () => {
    router.push('/bizgen/warehouse/find-stock');
  };


    
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading>{t.warehouse.warehouse}</Heading>

      <SimpleGrid columns={{base: 1, md: 3}} gap={4} mt={3}>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"} alignItems={"center"}>
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500" mb={1}>{t.warehouse.totalSkus}</Text>
                <Heading size="md">{warehouseSummary?.total_sku ?? 0}</Heading>
              </Flex>
              <Icon as={FiPackage} boxSize={6} />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"} alignItems={"center"}>
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500" mb={1}>{t.warehouse.onHandStock}</Text>
                <Heading size="md">{warehouseSummary?.total_stock_qty ?? 0}</Heading>
              </Flex>
              <Icon as={FiTruck} boxSize={6} />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Flex justify={"space-between"} alignItems={"center"}>
              <Flex flexDir={"column"}>
                <Text fontSize="sm" color="gray.500" mb={1}>{t.warehouse.pendingMovements}</Text>
                <Heading size="md">{warehouseSummary?.pending_movements ?? 0}</Heading>
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
              <Heading size="md">{t.warehouse.stockMovements}</Heading>
              <Flex gap={2}>
                <Button size="sm" variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={handleDirectToStockIn}>{t.warehouse.stockIn}</Button>
                <Button size="sm" variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={handleDirectToStockOut}>{t.warehouse.stockOut}</Button>
                <Button size="sm" variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={handleDirectToStockSample}>{t.warehouse.sampleOut}</Button>
              </Flex>
            </Flex>

            <Tabs.Root size="sm" colorScheme="blue" defaultValue="inbound">
              <Tabs.List>
                <Tabs.Trigger value="inbound">{t.warehouse.inbound}</Tabs.Trigger>
                <Tabs.Trigger value="outbound">{t.warehouse.outbound}</Tabs.Trigger>
                <Tabs.Trigger value="sample">{t.warehouse.sample}</Tabs.Trigger>
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
            <Heading size="md" mb={2}>{t.warehouse.recentActivity}</Heading>
            <Flex flexDir={"column"} gap={4} mt={3}> 
              <ActivityItem label="Stock checked & reconciled" meta="By Kevin • 10:02"/>
              <ActivityItem label="Cycle count — Aisle B3" meta="Yesterday • 17:44"/>
              <ActivityItem label="Sample dispatch created" meta="2 days ago"/>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Area for Warehouse Report */}
      <Heading size="md" mt={6}>{t.warehouse.reports}</Heading>
      <SimpleGrid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mt={3}>
        {/* Card for weekly report */}
        <Card.Root>
          <Card.Body>
            <Flex flexDir="column" gap={3}>
              <Heading size="sm">{t.warehouse.weeklyReport}</Heading>
              <Text fontSize="sm" color="gray.500">{t.warehouse.weeklyReportDesc}</Text>
              <Button size="sm" bg="#E77A1F" color="white" onClick={handleWeeklyStockReport}>{t.master.downloadExcel}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>
        {/* Card for report by product */}
        <Card.Root>
          <Card.Body>
            <Flex flexDir="column" gap={3}>
              <Heading size="sm">{t.warehouse.reportByProduct}</Heading>
              <Text fontSize="sm" color="gray.500">{t.warehouse.reportByProductDesc}</Text>
              <Button size="sm" variant="outline" borderColor="#E77A1F" color="#E77A1F" onClick={handleStockReportByProduct}>{t.warehouse.viewReport}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>
        {/* Card for stock search */}
        <Card.Root>
          <Card.Body>
            <Flex flexDir="column" gap={3}>
              <Heading size="sm">{t.warehouse.stockSearch}</Heading>
              <Text fontSize="sm" color="gray.500">{t.warehouse.stockSearchDesc}</Text>
              <Button size="sm" variant="outline" borderColor="#E77A1F" color="#E77A1F" onClick={handleStockSearchPage}>{t.warehouse.openSearch}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
      {/* Area for Warehouse Report */}

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
      