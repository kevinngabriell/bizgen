'use client';

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getGoodsReceipt, GetGoodsReceiptData } from "@/lib/purchase/goods-receipt";
import { getPurchaseImport, GetPurchaseImportData } from "@/lib/purchase/import";
import { getPurchaseInvoice, GetPurchaseInvoiceData } from "@/lib/purchase/invoice";
import { getPurchaseLocal, GetPurchaseLocalData } from "@/lib/purchase/local";
import { getPurchaseRequisition, GetPurchaseRequisitionData } from "@/lib/purchase/requisition";
import {
  Badge,
  Box,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  Flex,
  Heading,
  IconButton,
  Input,
  Pagination,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleType =
  | "quotation"
  | "requisition"
  | "local"
  | "import"
  | "goods_receipt"
  | "invoice";

type AnyRecord =
  | GetPurchaseRequisitionData
  | GetPurchaseLocalData
  | GetPurchaseImportData
  | GetGoodsReceiptData
  | GetPurchaseInvoiceData;

// ─── Column definitions per module ────────────────────────────────────────────

interface ColumnDef {
  label: string;
  render: (row: any) => React.ReactNode;
}

const COLUMNS: Record<ModuleType, ColumnDef[]> = {
  quotation: [],
  requisition: [
    { label: "PR Number",  render: (r: GetPurchaseRequisitionData) => <Text fontWeight="medium" fontSize="sm">{r.pr_number}</Text> },
    { label: "PR Date",    render: (r: GetPurchaseRequisitionData) => <Text fontSize="xs" color="gray.600">{fmtDate(r.pr_date)}</Text> },
    { label: "Created",    render: (r: GetPurchaseRequisitionData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  local: [
    { label: "PO Number",  render: (r: GetPurchaseLocalData) => <Text fontWeight="medium" fontSize="sm">{r.po_number}</Text> },
    { label: "PO Date",    render: (r: GetPurchaseLocalData) => <Text fontSize="xs" color="gray.600">{fmtDate(r.po_date)}</Text> },
    { label: "Created",    render: (r: GetPurchaseLocalData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  import: [
    { label: "PO Number",  render: (r: GetPurchaseImportData) => <Text fontWeight="medium" fontSize="sm">{r.po_number}</Text> },
    { label: "PO Date",    render: (r: GetPurchaseImportData) => <Text fontSize="xs" color="gray.600">{fmtDate(r.po_date)}</Text> },
    { label: "Created",    render: (r: GetPurchaseImportData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  goods_receipt: [
    { label: "Receipt No", render: (r: GetGoodsReceiptData) => <Text fontWeight="medium" fontSize="sm">{r.receipt_number}</Text> },
    { label: "Receipt Date", render: (r: GetGoodsReceiptData) => <Text fontSize="xs" color="gray.600">{fmtDate(r.receipt_date)}</Text> },
    { label: "Created",    render: (r: GetGoodsReceiptData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
  invoice: [
    { label: "Invoice No", render: (r: GetPurchaseInvoiceData) => <Text fontWeight="medium" fontSize="sm">{r.invoice_number}</Text> },
    { label: "Invoice Date", render: (r: GetPurchaseInvoiceData) => <Text fontSize="xs" color="gray.600">{fmtDate(r.invoice_date)}</Text> },
    { label: "Created",    render: (r: GetPurchaseInvoiceData) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ],
};

// ─── Row ID & detail route per module ─────────────────────────────────────────

function getRowId(type: ModuleType, row: AnyRecord): string {
  switch (type) {
    case "quotation":    return "";
    case "requisition":  return (row as GetPurchaseRequisitionData).pr_id;
    case "local":        return (row as GetPurchaseLocalData).purchase_id;
    case "import":       return (row as GetPurchaseImportData).purchase_import_id;
    case "goods_receipt":return (row as GetGoodsReceiptData).receipt_id;
    case "invoice":      return (row as GetPurchaseInvoiceData).purchase_invoice_id;
  }
}

function getDetailRoute(type: ModuleType, id: string): string {
  switch (type) {
    case "quotation":    return `/bizgen/purchase/request-quotation`;
    case "requisition":  return `/bizgen/purchase/purchase-requisition?pr_id=${id}`;
    case "local":        return `/bizgen/purchase/purchase-local?purchase_id=${id}`;
    case "import":       return `/bizgen/purchase/purchase-import?purchase_import_id=${id}`;
    case "goods_receipt":return `/bizgen/purchase/receiving-items?receipt_id=${id}`;
    case "invoice":      return `/bizgen/purchase/purchase-invoice?invoice_id=${id}`;
  }
}

function getCreateRoute(type: ModuleType): string {
  switch (type) {
    case "quotation":    return `/bizgen/purchase/request-quotation`;
    case "requisition":  return `/bizgen/purchase/purchase-requisition`;
    case "local":        return `/bizgen/purchase/purchase-local`;
    case "import":       return `/bizgen/purchase/purchase-import`;
    case "goods_receipt":return `/bizgen/purchase/receiving-items`;
    case "invoice":      return `/bizgen/purchase/purchase-invoice`;
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
    case "quotation":    return { data: [], pagination: {} };
    case "requisition":  return getPurchaseRequisition(page, limit, search);
    case "local":        return getPurchaseLocal(page, limit);
    case "import":       return getPurchaseImport(page, limit);
    case "goods_receipt":return getGoodsReceipt(page, limit, search);
    case "invoice":      return getPurchaseInvoice(page, limit);
  }
}

// ─── Module labels ─────────────────────────────────────────────────────────────

const MODULE_LABEL: Record<ModuleType, string> = {
  quotation:    "Request for Quotation",
  requisition:  "Purchase Requisition",
  local:        "Purchase Order — Local",
  import:       "Purchase Order — Import",
  goods_receipt:"Receiving Items / GR",
  invoice:      "Purchase Invoice",
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
  const rawType = searchParams.get("type") ?? "requisition";
  const type: ModuleType = (rawType as ModuleType) in MODULE_LABEL ? (rawType as ModuleType) : "requisition";

  const [data, setData] = useState<AnyRecord[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [fetching, setFetching] = useState(false);

  const totalCount: number = pagination?.total_items ?? pagination?.total ?? 0;
  const totalPages: number = pagination?.total_pages ?? (Math.ceil(totalCount / 15) || 1);

  const load = useCallback(async (p: number, search: string) => {
    setFetching(true);
    try {
      const res = await fetchModule(type, p, search);
      setData(res.data);
      setPagination(res.pagination);
    } catch {
      setData([]);
      setPagination({});
    } finally {
      setFetching(false);
    }
  }, [type]);

  useEffect(() => {
    setPage(1);
    setSearchInput("");
    setAppliedSearch("");
  }, [type]);

  useEffect(() => {
    load(page, appliedSearch);
  }, [page, appliedSearch, load]);

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
            <Breadcrumb.Link href="/bizgen/purchase" color="gray.500">Purchase</Breadcrumb.Link>
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
          <Text fontSize="sm" color="gray.500" mt={1}>
            {totalCount > 0 ? `${totalCount} record${totalCount !== 1 ? "s" : ""} found` : "No records found"}
          </Text>
        </Box>
        <Button
          size="sm"
          bg="#E77A1F"
          color="white"
          cursor="pointer"
          onClick={() => router.push(getCreateRoute(type))}
        >
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
                <Input
                  placeholder="Search by number, supplier, or reference..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  size="sm"
                />
                {appliedSearch && (
                  <IconButton
                    aria-label="Clear search"
                    size="sm"
                    variant="ghost"
                    onClick={handleClearSearch}
                  >
                    <FiX />
                  </IconButton>
                )}
              </Flex>
            </Box>
            <Button
              size="sm"
              bg="#E77A1F"
              color="white"
              cursor="pointer"
              onClick={handleSearch}
              minW="100px"
            >
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
                      key={id || idx}
                      _hover={{ bg: "orange.50", cursor: "pointer" }}
                      onClick={() => router.push(getDetailRoute(type, id))}
                      transition="background 0.15s"
                    >
                      <Table.Cell color="gray.400" fontSize="xs">{rowNum}</Table.Cell>
                      {columns.map((col) => (
                        <Table.Cell key={col.label}>{col.render(row)}</Table.Cell>
                      ))}
                      <Table.Cell>
                        <Button
                          size="xs"
                          variant="ghost"
                          color="#E77A1F"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(getDetailRoute(type, id));
                          }}
                        >
                          View
                        </Button>
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
      {!fetching && totalPages > 1 && (
        <Flex justify="flex-end" align="center" mt={5}>
          <Pagination.Root count={totalPages} pageSize={1} page={page} onPageChange={(details) => setPage(details.page)}>
            <ButtonGroup variant="ghost" size="sm" wrap="wrap">
              <Pagination.PrevTrigger asChild>
                <IconButton><LuChevronLeft /></IconButton>
              </Pagination.PrevTrigger>

              <Pagination.Items render={(pageItem) => (
                <IconButton key={pageItem.value} variant={pageItem.value === page ? "outline" : "ghost"} onClick={() => setPage(pageItem.value)}>
                  {pageItem.value}
                </IconButton>
              )} />

              <Pagination.NextTrigger asChild>
                <IconButton><LuChevronRight /></IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </Flex>
      )}
    </>
  );
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────

export default function SeeAllPurchase() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const valid = await checkAuthOrRedirect();
      if (!valid) return;
      const info = getAuthInfo();
      setAuth(info);
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
