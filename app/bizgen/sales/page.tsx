"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { GetRfq, getSalesRfq } from "@/lib/sales/rfq";
import { Button, Card, Flex, Heading, Text, SimpleGrid, Badge, Icon } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiFolder, FiFileText, FiCheckSquare, FiClipboard, FiDollarSign, FiShoppingCart, FiTruck, FiTrendingUp } from "react-icons/fi";

export default function Sales (){
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [salesRfqData, setSalesRfqData] = useState<GetRfq[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    try {
      const salesRfqRes = await getSalesRfq(1, 3, "");
      setSalesRfqData(salesRfqRes.data);
    }catch (error: any){
      setSalesRfqData([]);
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

  const handleDirectToDeliveryOrder = () => {
    router.push('/bizgen/sales/delivery-order');
  }

  const handleDirectToProfitSummary = () => {
    router.push('/bizgen/sales/profit-summary');
  }

  const handleDirectToInvoice= () => {
    router.push('/bizgen/sales/invoice');
  }

  const handleDirectToSalesRfqDetail = (rfq_id: string) => {
    router.push(`/bizgen/sales/inquiry?rfq_id=${rfq_id}`);
  }

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      
      {/* title, subtitle, and create new button */}
      <Flex gap={2} mb={2} mt="2" alignContent="center" justifyContent="space-between">
        <Flex flexDir={"column"}>
          <Heading>{t.sales_module.title}</Heading>
          <Text fontSize="sm" color="gray.500" mb="8">{t.sales_module.subtitle}</Text>
        </Flex>
        <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>{t.sales_module.create_new}</Button>
      </Flex>
          
      {/* Grid for all menus */}
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} gap={8}>
        {/* Inquiry card */}
        <Card.Root>
          <Card.Body>
            {/* Inquiry title and badge */}
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiFolder} />
              <Heading size="md" flex="1">{t.sales_module.inquiry.title}</Heading>
              <Badge color="purple">{t.sales_module.inquiry.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.inquiry.description}</Text>
                
            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.inquiry.last_records}</Text>
              {/* Sample data for inquiry */}
              <Flex direction="column" gap={1}>
                {salesRfqData?.map((rfq) => (
                  <Flex justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToSalesRfqDetail(rfq.sales_rfq_id)}>{rfq.sales_rfq_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{rfq.created_at}</Badge>
                  </Flex>
                ))}
              </Flex>
              {/* Sample data for inquiry */}
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.inquiry.see_all}</Button>
              <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDetailInquiry} >{t.sales_module.inquiry.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>
        
            {/* Quotation card */}
            <Card.Root>
              <Card.Body>
                {/* Quotation title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiFileText} />
                  <Heading size="md" flex="1">{t.sales_module.quotation.title}</Heading>
                  <Badge color="gray">{t.sales_module.quotation.badge}</Badge>
                </Flex>

                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.quotation.description}</Text>
                
                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.quotation.last_records}</Text>
                  
                  {/* Sample data for quotation */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.quotation.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDetailQuotation}>{t.sales_module.quotation.create}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Booking Confirmation card */}
            <Card.Root>
              <Card.Body>
                {/* Booking Confirmation title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiCheckSquare} />
                  <Heading size="md" flex="1">{t.sales_module.booking.title}</Heading>
                  <Badge color="green">{t.sales_module.booking.badge}</Badge>
                </Flex>

                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.booking.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.booking.last_records}</Text>

                  {/* Sample data for booking confirmation */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.booking.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToBooking}>{t.sales_module.booking.create}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Shipment card */}
            <Card.Root>
              <Card.Body>
                {/* Shipment title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiClipboard} />
                  <Heading size="md" flex="1">{t.sales_module.shipment.title}</Heading>
                  <Badge color="blue">{t.sales_module.shipment.badge}</Badge>
                </Flex>

                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.shipment.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.shipment.last_records}</Text>

                  {/* Sample data for shipment */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.shipment.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToShipment}>{t.sales_module.shipment.update}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Costing card */}
            <Card.Root>
              <Card.Body>
                {/* Costing title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiDollarSign} />
                  <Heading size="md" flex="1">{t.sales_module.costing.title}</Heading>
                  <Badge color="orange">{t.sales_module.costing.badge}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.costing.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.costing.last_records}</Text>
                  {/* Sample data for costing */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.costing.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDriectToCostingExpense}>{t.sales_module.costing.record}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Sales Order card */}
            <Card.Root>
              <Card.Body>
                {/* Sales order title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiShoppingCart} />
                  <Heading size="md" flex="1">{t.sales_module.sales_order.title}</Heading>
                  <Badge color="teal">{t.sales_module.sales_order.badge}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.sales_order.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.sales_order.last_records}</Text>
                  {/* Sample data for sales order */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.sales_order.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToSalesOrder}>{t.sales_module.sales_order.generate}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Delivery card */}
            <Card.Root>
              <Card.Body>
                {/* Delivery title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiTruck} />
                  <Heading size="md" flex="1">{t.sales_module.delivery.title}</Heading>
                  <Badge color="cyan">{t.sales_module.delivery.badge}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.delivery.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.delivery.last_records}</Text>
                  {/* Sample data for delivery */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.delivery.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDeliveryOrder}>{t.sales_module.delivery.issue}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Profit card */}
            <Card.Root>
              <Card.Body>
                {/* Profit title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiTrendingUp} />
                  <Heading size="md" flex="1">{t.sales_module.profit.title}</Heading>
                  <Badge color="pink">{t.sales_module.profit.badge}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.profit.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.profit.last_records}</Text>
                  {/* Sample data for profit */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.profit.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToProfitSummary}>{t.sales_module.profit.view}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
            {/* Invoice card */}
            <Card.Root>
              <Card.Body>
                {/* Invoice title and badge */}
                <Flex align="center" mb="3" gap={2}>
                  <Icon as={FiFileText} />
                  <Heading size="md" flex="1">{t.sales_module.invoice.title}</Heading>
                  <Badge colorScheme="purple">{t.sales_module.invoice.badge}</Badge>
                </Flex>
                <Text fontSize="sm" color="gray.600" mb="4">{t.sales_module.invoice.description}</Text>

                <Flex direction="column" gap={2} mb="3">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.sales_module.invoice.last_records}</Text>
                  {/* Sample data for invoice */}
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
                  <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.sales_module.invoice.see_all}</Button>
                  <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToInvoice}>{t.sales_module.invoice.create}</Button>
                </Flex>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
      </SidebarWithHeader>
    );
}