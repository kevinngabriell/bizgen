'use client';

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getInvoices, InvoiceListItem } from "@/lib/finance/invoice";
import { getVendorBills, VendorBillListItem } from "@/lib/finance/vendor-bill";
import { Badge, Box, Breadcrumb, Button, ButtonGroup, Card, Flex, Heading, IconButton, Input, Pagination, Spinner, Table, Text } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { getLang } from "@/lib/i18n";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

type ModuleType = "receivables" | "payables" | "income_ledger";
type AnyRecord = InvoiceListItem | VendorBillListItem;

const STATUS_COLOR: Record<string, string> = {
  draft: "gray", submitted: "blue", approved: "green", rejected: "red",
  paid: "teal", partial: "yellow", overdue: "red", cancelled: "red",
};

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

function fmtDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmount(amount: number) {
  if (amount == null) return "—";
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getColumns(type: ModuleType, t: ReturnType<typeof getLang>): ColumnDef[] {
  if (type === "receivables") return [
    { label: t.finance_see_all.invoice_no,   render: (r: InvoiceListItem) => <Text fontWeight="medium" fontSize="sm">{r.invoice_no}</Text> },
    { label: t.finance_see_all.customer,     render: (r: InvoiceListItem) => <Text fontSize="sm">{r.customer_name}</Text> },
    { label: t.finance_see_all.invoice_date, render: (r: InvoiceListItem) => <Text fontSize="xs" color="gray.600">{fmtDate(r.invoice_date)}</Text> },
    { label: t.finance_see_all.due_date,     render: (r: InvoiceListItem) => <Text fontSize="xs" color="gray.600">{fmtDate(r.due_date)}</Text> },
    { label: t.finance_see_all.total_amount, render: (r: InvoiceListItem) => <Text fontSize="sm" fontWeight="medium">{fmtAmount(r.total_amount)}</Text> },
    { label: t.finance_see_all.status,       render: (r: InvoiceListItem) => <StatusBadge status={r.status} /> },
    { label: t.finance_see_all.created,      render: (r: InvoiceListItem) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ];
  if (type === "payables") return [
    { label: t.finance_see_all.bill_no,      render: (r: VendorBillListItem) => <Text fontWeight="medium" fontSize="sm">{r.bill_no}</Text> },
    { label: t.finance_see_all.supplier,     render: (r: VendorBillListItem) => <Text fontSize="sm">{r.supplier_name}</Text> },
    { label: t.finance_see_all.bill_date,    render: (r: VendorBillListItem) => <Text fontSize="xs" color="gray.600">{fmtDate(r.bill_date)}</Text> },
    { label: t.finance_see_all.due_date,     render: (r: VendorBillListItem) => <Text fontSize="xs" color="gray.600">{fmtDate(r.due_date)}</Text> },
    { label: t.finance_see_all.total_amount, render: (r: VendorBillListItem) => <Text fontSize="sm" fontWeight="medium">{fmtAmount(r.total_amount)}</Text> },
    { label: t.finance_see_all.status,       render: (r: VendorBillListItem) => <StatusBadge status={r.bill_status} /> },
    { label: t.finance_see_all.created,      render: (r: VendorBillListItem) => <Text fontSize="xs" color="gray.500">{fmtDate(r.created_at)}</Text> },
  ];
  return [];
}

function getRowId(type: ModuleType, row: AnyRecord): string {
  switch (type) {
    case "receivables":  return (row as InvoiceListItem).invoice_id;
    case "payables":     return (row as VendorBillListItem).vendor_bill_id;
    case "income_ledger": return "";
  }
}

function getDetailRoute(type: ModuleType, id: string): string {
  switch (type) {
    case "receivables":  return `/bizgen/finance/create-invoice?invoice_id=${id}`;
    case "payables":     return `/bizgen/finance/create-vendor-bill?bill_id=${id}`;
    case "income_ledger": return `/bizgen/finance`;
  }
}

async function fetchModule(
  type: ModuleType,
  page: number,
  search: string
): Promise<{ data: AnyRecord[]; pagination: any }> {
  const limit = 15;
  switch (type) {
    case "receivables":  return getInvoices(page, limit, search);
    case "payables":     return getVendorBills(page, limit, search);
    case "income_ledger": return { data: [], pagination: { total_pages: 1, total: 0 } };
  }
}

function getModuleLabel(type: ModuleType, t: ReturnType<typeof getLang>): string {
  const map: Record<ModuleType, string> = {
    receivables:   t.finance_see_all.accounts_receivable,
    payables:      t.finance_see_all.accounts_payable,
    income_ledger: t.finance_see_all.income_ledger,
  };
  return map[type];
}

const CREATE_ROUTE: Record<ModuleType, string> = {
  receivables:  "/bizgen/finance/create-invoice",
  payables:     "/bizgen/finance/create-vendor-bill",
  income_ledger: "/bizgen/finance",
};

function SeeAllContent({ lang }: { lang: "en" | "id" }) {
  const t = getLang(lang);
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawType = searchParams.get("type") ?? "receivables";
  const VALID_TYPES: ModuleType[] = ["receivables", "payables", "income_ledger"];
  const type: ModuleType = VALID_TYPES.includes(rawType as ModuleType) ? (rawType as ModuleType) : "receivables";

  const [data, setData] = useState<AnyRecord[]>([]);
  const [pagination, setPagination] = useState<{ total_pages: number; page: number; total: number }>({ total_pages: 1, page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [fetching, setFetching] = useState(false);

  const totalCount: number = pagination?.total || 0;
  const totalPages: number = pagination?.total_pages || 1;

  useEffect(() => {
    setPage(1);
    setSearchInput("");
    setAppliedSearch("");
  }, [type]);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    fetchModule(type, page, appliedSearch)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setPagination({ total_pages: res.pagination?.total_pages || 1, page, total: res.pagination?.total || 0 });
      })
      .catch(() => { if (!cancelled) { setData([]); setPagination({ total_pages: 1, page: 1, total: 0 }); } })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [type, page, appliedSearch]);

  const handleSearch = () => { setPage(1); setAppliedSearch(searchInput); };
  const handleClearSearch = () => { setSearchInput(""); setPage(1); setAppliedSearch(""); };

  const columns = getColumns(type, t);

  return (
    <>
      <Breadcrumb.Root mb={3} fontSize="sm">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/bizgen/finance" color="gray.500">{t.finance_see_all.finance}</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.CurrentLink color="gray.700">{getModuleLabel(type, t)}</Breadcrumb.CurrentLink>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      <Flex justify="space-between" align="flex-end" mb={5}>
        <Box>
          <Heading size="lg">{getModuleLabel(type, t)}</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {totalCount > 0 ? `${totalCount} ${totalCount !== 1 ? t.finance_see_all.records_found : t.finance_see_all.record_found}` : t.finance_see_all.no_records_found}
          </Text>
        </Box>
        <Button bg="#E77A1F" color="white" cursor="pointer" onClick={() => router.push(CREATE_ROUTE[type])}>
          {t.finance_see_all.create_new}
        </Button>
      </Flex>

      <Card.Root mb={5}>
        <Card.Body py={4}>
          <Flex gap={3} align="flex-end" wrap="wrap">
            <Box flex="1" minW="220px">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>{t.finance_see_all.search}</Text>
              <Flex gap={2}>
                <Input
                  placeholder={t.finance_see_all.search_placeholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {appliedSearch && (
                  <IconButton aria-label="Clear search" variant="ghost" onClick={handleClearSearch}>
                    <FiX />
                  </IconButton>
                )}
              </Flex>
            </Box>
            <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSearch} minW="100px">
              <FiSearch /> {t.finance_see_all.search}
            </Button>
          </Flex>
          {appliedSearch && (
            <Flex align="center" gap={1} mt={3}>
              <Text fontSize="xs" color="gray.500">{t.finance_see_all.showing_results_for}</Text>
              <Badge variant="subtle" color="orange" fontSize="xs">"{appliedSearch}"</Badge>
            </Flex>
          )}
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body p={0}>
          {fetching ? (
            <Flex justify="center" align="center" py={16}>
              <Spinner size="lg" color="#E77A1F" />
            </Flex>
          ) : type === "income_ledger" ? (
            <Flex direction="column" align="center" justify="center" py={16} gap={2}>
              <Text color="gray.400" fontSize="sm">{t.finance_see_all.income_ledger_coming_soon}</Text>
            </Flex>
          ) : data.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={16} gap={2}>
              <Text color="gray.400" fontSize="sm">{t.finance_see_all.no_records_found}</Text>
              {appliedSearch && (
                <Button size="xs" variant="ghost" color="#E77A1F" onClick={handleClearSearch}>{t.finance_see_all.clear_filter}</Button>
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
                        <Button
                          variant="ghost"
                          color="#E77A1F"
                          onClick={(e) => { e.stopPropagation(); router.push(getDetailRoute(type, id)); }}
                        >
                          {t.finance_see_all.view}
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

      <Flex justify="flex-end" alignItems="end" width="100%" mt={3}>
        <Pagination.Root count={totalPages} pageSize={1} page={page} onPageChange={(details) => setPage(details.page)}>
          <ButtonGroup variant="ghost" size="sm" wrap="wrap">
            <Pagination.PrevTrigger asChild>
              <IconButton><LuChevronLeft /></IconButton>
            </Pagination.PrevTrigger>
            <Pagination.Items render={(pageItem) => (
              <IconButton
                key={pageItem.value}
                variant={pageItem.value === page ? "outline" : "ghost"}
                onClick={() => setPage(pageItem.value)}
              >
                {pageItem.value}
              </IconButton>
            )} />
            <Pagination.NextTrigger asChild>
              <IconButton><LuChevronRight /></IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      </Flex>
    </>
  );
}

export default function SeeAllFinance() {
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
        <SeeAllContent lang={lang} />
      </Suspense>
    </SidebarWithHeader>
  );
}
