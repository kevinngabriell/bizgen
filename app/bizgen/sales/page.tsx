"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { SALES_CREATE_ROLES, DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { GetSalesBookingData, getSalesJobOrder } from "@/lib/sales/booking-confirmation";
import { getSalesCosting, GetSalesCostingData } from "@/lib/sales/costing";
import { GetSalesDeliveryItemData, getSalesdeliveryOrder } from "@/lib/sales/delivery-order";
import { getSalesDocument, GetSalesDocumentItemData } from "@/lib/sales/document";
import { getSalesInvoice, GetSalesInvoiceItemData } from "@/lib/sales/invoice";
import { getSalesProfit, GetSalesProfitItemData } from "@/lib/sales/profit";
import { getSalesQuotations, GetSalesQuotationsData } from "@/lib/sales/quotation";
import { GetRfq, getSalesRfq } from "@/lib/sales/rfq";
import { getSalesOrder, GetSalesOrderItemData } from "@/lib/sales/sales-order";
import { Button, Card, Flex, Heading, Text, SimpleGrid, Badge, Icon } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, JSX } from "react";
import { FiFolder, FiFileText, FiCheckSquare, FiClipboard, FiDollarSign, FiShoppingCart, FiTruck, FiTrendingUp } from "react-icons/fi";

export default function Sales (){
  //set auth, loading, and routing
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //language state
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const canCreate = SALES_CREATE_ROLES.has(auth?.app_role_id ?? "");

  //fetch top data
  const [salesRfqData, setSalesRfqData] = useState<GetRfq[]>([]);
  const [salesQuotationData, setSalesQuotationData] = useState<GetSalesQuotationsData[]>([]);
  const [salesJobOrderData, setSalesJobOrderData] = useState<GetSalesBookingData[]>([]);
  const [salesShipmentData, setSalesShipmentData] = useState<GetSalesDocumentItemData[]>([]);
  const [salesCostingData, setSalesCostingData] = useState<GetSalesCostingData[]>([]);
  const [salesOrderData, setSalesOrderData] = useState<GetSalesOrderItemData[]>([]);
  const [salesDeliveryData, setSalesDeliveryData] = useState<GetSalesDeliveryItemData[]>([]);
  const [salesProfitData, setSalesProfitData] = useState<GetSalesProfitItemData[]>([]);
  const [salesInvoiceData, setSalesInvoiceData] = useState<GetSalesInvoiceItemData[]>([]);

  //formating date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

    const [
      salesRfqRes,
      salesQuotationRes,
      salesJobOrderRes,
      salesDocumentRes,
      salesCostingRes,
      salesOrderRes,
      salesDeliveryRes,
      salesProfitRes,
      salesInvoiceRes,
    ] = await Promise.allSettled([
      getSalesRfq(1, 3, ""),
      getSalesQuotations(1, 3, ""),
      getSalesJobOrder(1, 3, ""),
      getSalesDocument(1, 3, ""),
      getSalesCosting(1, 3, ""),
      getSalesOrder(1, 3, ""),
      getSalesdeliveryOrder(1, 3, ""),
      getSalesProfit(1, 3, ""),
      getSalesInvoice(1, 3, ""),
    ]);

    if (salesRfqRes.status === "fulfilled") setSalesRfqData(salesRfqRes.value.data);
    if (salesQuotationRes.status === "fulfilled") setSalesQuotationData(salesQuotationRes.value.data);
    if (salesJobOrderRes.status === "fulfilled") setSalesJobOrderData(salesJobOrderRes.value.data);
    if (salesDocumentRes.status === "fulfilled") setSalesShipmentData(salesDocumentRes.value.data);
    if (salesCostingRes.status === "fulfilled") setSalesCostingData(salesCostingRes.value.data);
    if (salesOrderRes.status === "fulfilled") setSalesOrderData(salesOrderRes.value.data);
    if (salesDeliveryRes.status === "fulfilled") setSalesDeliveryData(salesDeliveryRes.value.data);
    if (salesProfitRes.status === "fulfilled") setSalesProfitData(salesProfitRes.value.data);
    if (salesInvoiceRes.status === "fulfilled") setSalesInvoiceData(salesInvoiceRes.value.data);

    setLoading(false);
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

  const handleDirectToSalesQuotation = (quotation_id: string) => {
    router.push(`/bizgen/sales/quotation?quotation_id=${quotation_id}`);
  }

  const handleDirectToSalesBookConfirmation = (booking_id: string) => {
    router.push(`/bizgen/sales/booking-confirmation?booking_id=${booking_id}`);
  }

  const handleDirectToSalesShipment = (shipment_id: string) => {
    router.push(`/bizgen/sales/shipment-process?shipment_id=${shipment_id}`);
  }

  const handleDirectToCosting = (costing_id: string) => {
    router.push(`/bizgen/sales/costing-expense?costing_id=${costing_id}`);
  }

  const handleDirectToSalesOrderDetail = (sales_order_id: string) => {
    router.push(`/bizgen/sales/sales-order?sales_order_id=${sales_order_id}`);
  }

  const handleDirectToDeliveryDetail = (delivery_order_id: string) => {
    router.push(`/bizgen/sales/delivery-order?delivery_order_id=${delivery_order_id}`);
  }

  const handleDirectToProfitDetail = (profit_id: string) => {
    router.push(`/bizgen/sales/profit-summary?profit_id=${profit_id}`);
  }

  const handleDirectToInvoiceDetail = (invoice_id: string) => {
    router.push(`/bizgen/sales/invoice?invoice_id=${invoice_id}`);
  }

  const handleToSeeAll = (type: string) => {
    router.push(`/bizgen/sales/see-all?type=${type}`);
  }

  // Helper function to render lists with empty/placeholder state
  const renderList = (data: any[], renderItem: (item: any) => JSX.Element) => {
    if (!data || data.length === 0) {
      return (
        <Text fontSize="xs" color="gray.400" fontStyle="italic">No data available</Text>
      );
    }

    const filledData = [...data];
    while (filledData.length < 3) {
      filledData.push(null);
    }

    return filledData.map((item, index) => {
      if (!item) {
        return (
          <Flex key={index} justify="space-between" opacity={0.4}>
            <Text fontSize="xs" color="gray.400">—</Text>
            <Text fontSize="xs" color="gray.300">—</Text>
          </Flex>
        );
      }
      return renderItem(item);
    });
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      
      {/* title, subtitle, and create new button */}
      <Flex gap={2} mb={2} mt="2" alignContent="center" justifyContent="space-between">
        <Flex flexDir={"column"}>
          <Heading>{t.sales_module.title}</Heading>
          <Text fontSize="sm" color="gray.500" mb="8">{t.sales_module.subtitle}</Text>
        </Flex>
        {canCreate && <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>{t.sales_module.create_new}</Button>}
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
              {/* Data for inquiry */}
              <Flex direction="column" gap={1}>
                {renderList(salesRfqData, (rfq) => (
                  <Flex key={rfq.inquiry_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToSalesRfqDetail(rfq.inquiry_id)}>{rfq.rfq_no}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(rfq.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("inquiry")}>{t.sales_module.inquiry.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDetailInquiry} >{t.sales_module.inquiry.create}</Button>}
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
                {renderList(salesQuotationData, (quotation) => (
                  <Flex key={quotation.sales_quotation_number} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToSalesQuotation(quotation.sales_quotation_id)}>{quotation.sales_quotation_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(quotation.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

          <Flex justify="space-between">
            <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("quotation")}>{t.sales_module.quotation.see_all}</Button>
            {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDetailQuotation}>{t.sales_module.quotation.create}</Button>}
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
                {renderList(salesJobOrderData, (job) => (
                  <Flex key={job.job_order_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToSalesBookConfirmation(job.job_order_id)}>{job.job_order_no}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(job.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("booking")}>{t.sales_module.booking.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToBooking}>{t.sales_module.booking.create}</Button>}
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
                {renderList(salesShipmentData, (ship) => (
                  <Flex key={ship.shipment_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToSalesShipment(ship.shipment_id)}>{ship.shipment_no}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(ship.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("shipment")}>{t.sales_module.shipment.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToShipment}>{t.sales_module.shipment.update}</Button>}
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
                {renderList(salesCostingData, (cost) => (
                  <Flex key={cost.sales_costing_expense_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToCosting(cost.sales_costing_expense_id)}>
                      {cost.sales_costing_no}
                    </Text>
                    <Badge colorScheme="gray" variant="subtle">
                      {formatDate(cost.created_at)}
                    </Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("costing")}>{t.sales_module.costing.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDriectToCostingExpense}>{t.sales_module.costing.record}</Button>}
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
                {renderList(salesOrderData, (so) => (
                  <Flex key={so.sales_order_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToSalesOrderDetail(so.sales_order_id)}>{so.sales_order_no}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(so.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("sales_order")}>{t.sales_module.sales_order.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToSalesOrder}>{t.sales_module.sales_order.generate}</Button>}
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
                {renderList(salesDeliveryData, (sdo) => (
                  <Flex key={sdo.delivery_order_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToDeliveryDetail(sdo.delivery_order_id)}>{sdo.do_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(sdo.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("delivery")}>{t.sales_module.delivery.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToDeliveryOrder}>{t.sales_module.delivery.issue}</Button>}
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
                {renderList(salesProfitData, (spo) => (
                  <Flex key={spo.profit_summary_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToProfitDetail(spo.profit_summary_id)}>{spo.sales_profit_no}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(spo.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("profit")}>{t.sales_module.profit.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToProfitSummary}>{t.sales_module.profit.view}</Button>}
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
                {renderList(salesInvoiceData, (sio) => (
                  <Flex key={sio.invoice_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => handleDirectToInvoiceDetail(sio.invoice_id)}>{sio.invoice_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(sio.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => handleToSeeAll("invoice")}>{t.sales_module.invoice.see_all}</Button>
              {canCreate && <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleDirectToInvoice}>{t.sales_module.invoice.create}</Button>}
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </SidebarWithHeader>
  );
}