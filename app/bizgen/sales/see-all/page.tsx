'use client';

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getSalesJobOrder, GetSalesBookingData } from "@/lib/sales/booking-confirmation";
import { getSalesCosting, GetSalesCostingData } from "@/lib/sales/costing";
import { getSalesdeliveryOrder, GetSalesDeliveryItemData } from "@/lib/sales/delivery-order";
import { getSalesDocument, GetSalesDocumentItemData } from "@/lib/sales/document";
import { getSalesInvoice, GetSalesInvoiceItemData } from "@/lib/sales/invoice";
import { getSalesProfit, GetSalesProfitItemData } from "@/lib/sales/profit";
import { getSalesRfq, GetRfq } from "@/lib/sales/rfq";
import { getSalesOrder, GetSalesOrderItemData } from "@/lib/sales/sales-order";
import { getSalesQuotations, GetSalesQuotationsData } from "@/lib/sales/quotation";
import { Badge, Box, Breadcrumb, Button, ButtonGroup, Card, Flex, Heading, IconButton, Input, Pagination, Spinner, Table, Text } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

type ModuleType = | "inquiry" | "quotation" | "booking" | "shipment" | "costing" | "sales_order" | "delivery" | "profit" | "invoice";
type AnyRecord = | GetRfq | GetSalesQuotationsData | GetSalesBookingData | GetSalesDocumentItemData | GetSalesCostingData | GetSalesOrderItemData | GetSalesDeliveryItemData | GetSalesProfitItemData | GetSalesInvoiceItemData;

const STATUS_COLOR: Record<string, string> = { draft: "gray", submitted: "blue", approved: "green", rejected: "red", quoted: "purple", confirmed: "teal", sent: "cyan", cancelled: "red" };

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status?.toLowerCase()] ?? "gray";
  return (
    <Badge color={color} variant="subtle" textTransform="capitalize">
      {status}
    </Badge>
  );
}

interface ColumnDef {
  label: string;
  render: (row: any) => React.ReactNode;
}

const COLUMNS: Record<ModuleType, ColumnDef[]> = {
  inquiry: [
    { label: "RFQ No",    render: (r: GetRfq) => <Text fontWeight="medium" fontSize="sm">{r.rfq_no}</Text> },
    { label: "Customer",  render: (r: GetRfq) => <Text fontSize="sm">{r.customer_name}</Text> },
    { label: "Mode",      render: (r: GetRfq) => <Badge variant="outline" fontSize="xs">{r.ship_via_name}</Badge> },
    { label: "Route",     render: (r: GetRfq) => <Text fontSize="xs" color="gray.600">{r.origin_name} → {r.destination_name}</Text> },
    { label: "Commodity", render: (r: GetRfq) => <Text fontSize="xs">{r.commodity_name}</Text> },
    { label: "Status",    render: (r: GetRfq) => <StatusBadge status={r.status} /> },
    { label: "Created",   render: (r: GetRfq) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  quotation: [
    { label: "Quotation No", render: (r: GetSalesQuotationsData) => <Text fontWeight="medium" fontSize="sm">{r.sales_quotation_number}</Text> },
    { label: "Customer", render: (r: GetSalesQuotationsData) => <Text fontSize="sm">{r.customer_name}</Text> },
    { label: "Currency", render: (r: GetSalesQuotationsData) => <Badge variant="outline" fontSize="xs">{r.currency_symbol}</Badge> },
    { label: "Status", render: (r: GetSalesQuotationsData) => <StatusBadge status={r.quotation_status} /> },
    { label: "Created", render: (r: GetSalesQuotationsData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  booking: [
    { label: "Job Order No", render: (r: GetSalesBookingData) => <Text fontWeight="medium" fontSize="sm">{r.job_order_no}</Text> },
    { label: "Created", render: (r: GetSalesBookingData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  shipment: [
    { label: "Shipment No", render: (r: GetSalesDocumentItemData) => <Text fontWeight="medium" fontSize="sm">{r.shipment_no}</Text> },
    { label: "Created", render: (r: GetSalesDocumentItemData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  costing: [
    { label: "Costing No", render: (r: GetSalesCostingData) => <Text fontWeight="medium" fontSize="sm">{r.sales_costing_no}</Text> },
    { label: "Created", render: (r: GetSalesCostingData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  sales_order: [
    { label: "Sales Order No", render: (r: GetSalesOrderItemData) => <Text fontWeight="medium" fontSize="sm">{r.sales_order_no}</Text> },
    { label: "Created", render: (r: GetSalesOrderItemData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  delivery: [
    { label: "DO Number", render: (r: GetSalesDeliveryItemData) => <Text fontWeight="medium" fontSize="sm">{r.do_number}</Text> },
    { label: "Created", render: (r: GetSalesDeliveryItemData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  profit: [
    { label: "Profit No", render: (r: GetSalesProfitItemData) => <Text fontWeight="medium" fontSize="sm">{r.sales_profit_no}</Text> },
    { label: "Created", render: (r: GetSalesProfitItemData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  invoice: [
    { label: "Invoice No", render: (r: GetSalesInvoiceItemData) => <Text fontWeight="medium" fontSize="sm">{r.invoice_number}</Text> },
    { label: "Created", render: (r: GetSalesInvoiceItemData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
};

// ─── Row ID & detail route per module ─────────────────────────────────────────

function getRowId(type: ModuleType, row: AnyRecord): string {
  switch (type) {
    case "inquiry":     return (row as GetRfq).inquiry_id;
    case "quotation":   return (row as GetSalesQuotationsData).sales_quotation_id;
    case "booking":     return (row as GetSalesBookingData).job_order_id;
    case "shipment":    return (row as GetSalesDocumentItemData).shipment_id;
    case "costing":     return (row as GetSalesCostingData).sales_costing_expense_id;
    case "sales_order": return (row as GetSalesOrderItemData).sales_order_id;
    case "delivery":    return (row as GetSalesDeliveryItemData).delivery_order_id;
    case "profit":      return (row as GetSalesProfitItemData).profit_summary_id;
    case "invoice":     return (row as GetSalesInvoiceItemData).invoice_id;
  }
}

function getDetailRoute(type: ModuleType, id: string): string {
  switch (type) {
    case "inquiry":     return `/bizgen/sales/inquiry?rfq_id=${id}`;
    case "quotation":   return `/bizgen/sales/quotation?quotation_id=${id}`;
    case "booking":     return `/bizgen/sales/booking-confirmation?booking_id=${id}`;
    case "shipment":    return `/bizgen/sales/shipment-process?shipment_id=${id}`;
    case "costing":     return `/bizgen/sales/costing-expense?costing_id=${id}`;
    case "sales_order": return `/bizgen/sales/sales-order?sales_order_id=${id}`;
    case "delivery":    return `/bizgen/sales/delivery-order?delivery_order_id=${id}`;
    case "profit":      return `/bizgen/sales/profit-summary?profit_id=${id}`;
    case "invoice":     return `/bizgen/sales/invoice?invoice_id=${id}`;
  }
}

// ─── Fetch function per module ─────────────────────────────────────────────────

async function fetchModule(
  type: ModuleType,
  page: number,
  search: string
): Promise<{ data: AnyRecord[]; pagination: any }> {
  const limit = 15;
  switch (type) {
    case "inquiry":     
      return getSalesRfq(page, limit, search);
    case "quotation":   
      return getSalesQuotations(page, limit, search);
    case "booking":     
      return getSalesJobOrder(page, limit, search);
    case "shipment":    
      return getSalesDocument(page, limit, search);
    case "costing":     
      return getSalesCosting(page, limit, search);
    case "sales_order": 
      return getSalesOrder(page, limit, search);
    case "delivery":    
      return getSalesdeliveryOrder(page, limit, search);
    case "profit":      
      return getSalesProfit(page, limit, search);
    case "invoice":     
      return getSalesInvoice(page, limit, search);
  }
}

// ─── Module labels ─────────────────────────────────────────────────────────────

const MODULE_LABEL: Record<ModuleType, string> = {
  inquiry:     "Inquiry / RFQ",
  quotation:   "Quotation",
  booking:     "Booking Confirmation / Job Order",
  shipment:    "Shipment Processing & Documents",
  costing:     "Costing & Expense",
  sales_order: "Sales Order",
  delivery:    "Delivery Order",
  profit:      "Profit Summary",
  invoice:     "Invoice",
};

// ─── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Inner content (uses useSearchParams) ─────────────────────────────────────

function SeeAllContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawType = searchParams.get("type") ?? "inquiry";
  const type: ModuleType = (rawType as ModuleType) in MODULE_LABEL ? (rawType as ModuleType) : "inquiry";

  const [data, setData] = useState<AnyRecord[]>([]);
  const [pagination, setPagination] = useState<{ total_pages: number; page: number; total: number; }>({ total_pages: 1, page: 1, total : 1 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [fetching, setFetching] = useState(false);

  const totalCount: number = pagination?.total || 0;
  const totalPages: number = pagination?.total_pages || 1;

  // Reset page and search whenever type changes
  useEffect(() => {
    setPage(1);
    setSearchInput("");
    setAppliedSearch("");
  }, [type]);

  // Fetch whenever type, page, or search changes
  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    fetchModule(type, page, appliedSearch)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setPagination({
          total_pages: res.pagination?.total_pages || 1,
          page,
          total: res.pagination?.total || 1
        });
      })
      .catch(() => { if (!cancelled) { setData([]); setPagination({ total_pages: 1, page: 1, total: 1 }); } })
      .finally(() => { if (!cancelled) setFetching(false); });

    return () => { cancelled = true; };
  }, [type, page, appliedSearch]);

  const handleSearch = () => {
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setPage(1);
    setAppliedSearch("");
  };

  const columns = COLUMNS[type];

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumb.Root mb={3} fontSize="sm">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/bizgen/sales" color="gray.500">Sales</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink color="gray.700">{MODULE_LABEL[type]}</Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      {/* Page title */}
      <Flex justify="space-between" align="flex-end" mb={5}>
        <Box>
          <Heading size="lg">{MODULE_LABEL[type]}</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>{totalCount > 0 ? `${totalCount} record${totalCount !== 1 ? "s" : ""} found` : "No records found"}</Text>
        </Box>
        <Button bg="#E77A1F" color="white" cursor="pointer"
          onClick={() => {
            const routes: Record<ModuleType, string> = {
              inquiry:     "/bizgen/sales/inquiry",
              quotation:   "/bizgen/sales/quotation",
              booking:     "/bizgen/sales/booking-confirmation",
              shipment:    "/bizgen/sales/shipment-process",
              costing:     "/bizgen/sales/costing-expense",
              sales_order: "/bizgen/sales/sales-order",
              delivery:    "/bizgen/sales/delivery-order",
              profit:      "/bizgen/sales/profit-summary",
              invoice:     "/bizgen/sales/invoice",
            };
            router.push(routes[type]);
          }}>
          + Create New
        </Button>
      </Flex>

      {/* Filter bar */}
      <Card.Root mb={5}>
        <Card.Body py={4}>
          <Flex gap={3} align="flex-end" wrap="wrap">
            <Box flex="1" minW="220px">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>Search</Text>
              <Flex gap={2}>
                <Input placeholder="Search by number, customer, or reference..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()}/>
                {appliedSearch && (
                  <IconButton aria-label="Clear search" variant="ghost" onClick={handleClearSearch}>
                    <FiX />
                  </IconButton>
                )}
              </Flex>
            </Box>
            <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSearch}minW="100px">
              <FiSearch /> Search
            </Button>
          </Flex>
          {appliedSearch && (
            <Flex align="center" gap={1} mt={3}>
              <Text fontSize="xs" color="gray.500">Showing results for:</Text>
              <Badge variant="subtle" color="orange" fontSize="xs">"{appliedSearch}"</Badge>
            </Flex>
          )}
        </Card.Body>
      </Card.Root>

      {/* Table */}
      <Card.Root>
        <Card.Body p={0}>
          {fetching ? (
            <Flex justify="center" align="center" py={16}>
              <Spinner size="lg" color="#E77A1F" />
            </Flex>
          ) : data.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={16} gap={2}>
              <Text color="gray.400" fontSize="sm">No {MODULE_LABEL[type]} records found.</Text>
              {appliedSearch && (
                <Button size="xs" variant="ghost" color="#E77A1F" onClick={handleClearSearch}>Clear filter</Button>
              )}
            </Flex>
          ) : (
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader w="48px" color="gray.500" fontSize="xs">#</Table.ColumnHeader>
                  {columns.map((col) => (
                    <Table.ColumnHeader key={col.label} color="gray.500" fontSize="xs" fontWeight="semibold">
                      {col.label}
                    </Table.ColumnHeader>
                  ))}
                  <Table.ColumnHeader w="80px" />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.map((row, idx) => {
                  const id = getRowId(type, row);
                  const rowNum = (page - 1) * 15 + idx + 1;
                  return (
                    <Table.Row
                      key={id}
                      _hover={{ bg: "orange.50", cursor: "pointer" }}
                      onClick={() => router.push(getDetailRoute(type, id))}
                      transition="background 0.15s"
                    >
                      <Table.Cell color="gray.400" fontSize="xs">{rowNum}</Table.Cell>
                      {columns.map((col) => (
                        <Table.Cell key={col.label}>{col.render(row)}</Table.Cell>
                      ))}
                      <Table.Cell>
                        <Button variant="ghost" color="#E77A1F"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(getDetailRoute(type, id));
                          }}
                        > View </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Card.Body>
      </Card.Root>

      {/* Pagination */}
      <Flex display={"flex"} justify="flex-end" alignItems={"end"} width={"100%"} mt={"3"}>
        <Pagination.Root count={totalPages} pageSize={1} page={page} onPageChange={(details) => setPage(details.page)}>
          <ButtonGroup variant="ghost" size="sm" wrap="wrap">
            <Pagination.PrevTrigger asChild>
              <IconButton>
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items render={(pageItem) => (
              <IconButton key={pageItem.value} variant={pageItem.value === page ? "outline" : "ghost"} onClick={() => setPage(pageItem.value)}>{pageItem.value}</IconButton>
            )}/>

            <Pagination.NextTrigger asChild>
              <IconButton>
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      </Flex>
    </>
  );
}

export default function SeeAllSales() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "id">("en");

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuthOrRedirect();
      if (!valid) return;
      const info = getAuthInfo();
      setAuth(info);
      setLang(info?.language === "id" ? "id" : "en");
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Suspense fallback={
        <Flex justify="center" align="center" py={16}>
          <Spinner size="lg" color="#E77A1F" />
        </Flex>
      }>
        <SeeAllContent />
      </Suspense>
    </SidebarWithHeader>
  );
}
