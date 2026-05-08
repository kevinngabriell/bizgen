"use client";

import { useEffect, useState } from "react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import {
  Badge, Box, Card, Flex, Heading, Icon, SimpleGrid, Text,
} from "@chakra-ui/react";
import Loading from "@/components/loading";
import { useRouter } from "next/navigation";
import { getActiveAnnouncements, Announcement } from "@/lib/system/announcement";
import AnnouncementPopup from "@/components/announcement/AnnouncementPopup";
import { getFinanceSummary, FinanceSummaryData } from "@/lib/finance/finance";
import { getInvoices, InvoiceListItem } from "@/lib/finance/invoice";
import { getVendorBills, VendorBillListItem } from "@/lib/finance/vendor-bill";
import { getSalesQuotations, GetSalesQuotationsData } from "@/lib/sales/quotation";
import { getPurchaseRequisition, GetPurchaseRequisitionData } from "@/lib/purchase/requisition";
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiFileText,
  FiShoppingCart, FiAlertCircle, FiUser, FiCalendar,
} from "react-icons/fi";
import { getLang } from "@/lib/i18n";

const STATUS_COLOR: Record<string, string> = {
  draft: "gray",
  submitted: "orange",
  posted: "green",
  approved: "green",
  cancelled: "red",
  rejected: "red",
  paid: "blue",
  partially_paid: "purple",
  overdue: "red",
  open: "blue",
  closed: "gray",
};

function formatAmount(n: number) {
  return `Rp ${Number(n).toLocaleString("id-ID")}`;
}

function formatDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dueDate: string, status: string) {
  if (!dueDate || status === "paid") return false;
  return new Date(dueDate) < new Date();
}

export default function Dashboard() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const [summary, setSummary] = useState<FinanceSummaryData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [bills, setBills] = useState<VendorBillListItem[]>([]);
  const [quotations, setQuotations] = useState<GetSalesQuotationsData[]>([]);
  const [requisitions, setRequisitions] = useState<GetPurchaseRequisitionData[]>([]);

  const init = async () => {
    setLoading(true);
    const valid = await checkAuthOrRedirect();
    if (!valid) return;

    const info = getAuthInfo();
    setAuth(info);
    setLang(info?.language === "id" ? "id" : "en");

    const token = localStorage.getItem("token") ?? "";
    const sessionKey = `announcement_shown_${token.slice(-8)}`;
    if (!sessionStorage.getItem(sessionKey)) {
      try {
        const active = await getActiveAnnouncements();
        if (active.length > 0) { setAnnouncements(active); setShowPopup(true); }
      } catch {}
      sessionStorage.setItem(sessionKey, "true");
    }

    try {
      const [summaryRes, invoicesRes, billsRes, quotRes, prRes] = await Promise.all([
        getFinanceSummary(),
        getInvoices(1, 5, ""),
        getVendorBills(1, 5, ""),
        getSalesQuotations(1, 5, ""),
        getPurchaseRequisition(1, 5, ""),
      ]);
      setSummary(summaryRes);
      setInvoices(invoicesRes.data);
      setBills(billsRes.data);
      setQuotations(quotRes.data);
      setRequisitions(prRes.data);
    } catch (e) {
      console.error("Dashboard fetch error", e);
    }

    setLoading(false);
  };

  useEffect(() => { init(); }, []);

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <AnnouncementPopup announcements={announcements} open={showPopup} onClose={() => setShowPopup(false)} />

      <Heading size="lg" mb={6}>{t.erp_dashboard.title}</Heading>

      {/* ── KPI Strip ── */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <KpiCard
          label={t.erp_dashboard.outstanding_receivables}
          value={formatAmount(summary?.outstanding_receivables ?? 0)}
          sub={`${summary?.receivables.unpaid_receivables_overdue_count ?? 0} ${t.erp_dashboard.overdue}`}
          subColor="red.500"
          icon={FiTrendingUp}
          iconColor="green.400"
          onClick={() => router.push("/bizgen/finance?tab=receivables")}
        />
        <KpiCard
          label={t.erp_dashboard.outstanding_payables}
          value={formatAmount(summary?.outstanding_payables ?? 0)}
          sub={t.erp_dashboard.awaiting_payment}
          icon={FiTrendingDown}
          iconColor="red.400"
          onClick={() => router.push("/bizgen/finance?tab=payables")}
        />
        <KpiCard
          label={t.erp_dashboard.cashflow_balance}
          value={formatAmount(summary?.cashflow_balance ?? 0)}
          sub={t.erp_dashboard.income_minus_expenses}
          icon={FiDollarSign}
          iconColor="blue.400"
          onClick={() => router.push("/bizgen/finance")}
        />
        <KpiCard
          label={t.erp_dashboard.pending_invoices}
          value={`${summary?.receivables.customer_invoices_pending_count ?? 0} Docs`}
          sub={`${t.erp_dashboard.received_today} ${formatAmount(summary?.receivables.payment_received_today_amount ?? 0)}`}
          icon={FiFileText}
          iconColor="orange.400"
          onClick={() => router.push("/bizgen/finance/see-all?type=receivables")}
        />
      </SimpleGrid>

      {/* ── Finance Activity ── */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={5} mt={6}>
        {/* Recent Invoices */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box w={1} h={4} bg="#E77A1F" borderRadius="full" />
                <Heading size="sm" color="gray.700">{t.erp_dashboard.recent_invoices}</Heading>
              </Flex>
              <Text
                fontSize="xs" color="#E77A1F" cursor="pointer" fontWeight="medium"
                onClick={() => router.push("/bizgen/finance/see-all?type=receivables")}
              >
                {t.erp_dashboard.view_all}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body pt={0}>
            {invoices.length === 0 ? (
              <EmptyState label={t.erp_dashboard.no_invoices} />
            ) : (
              <Box>
                {invoices.map((inv, idx) => {
                  const overdue = isOverdue(inv.due_date, inv.status);
                  const displayStatus = overdue ? "overdue" : inv.status;
                  return (
                    <Flex
                      key={inv.invoice_id}
                      justify="space-between"
                      align="center"
                      py={2.5}
                      borderBottom={idx < invoices.length - 1 ? "1px solid" : "none"}
                      borderColor="gray.100"
                      gap={3}
                    >
                      <Flex flexDir="column" flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800" lineClamp={1}>
                          {inv.invoice_no}
                        </Text>
                        <Flex align="center" gap={1}>
                          <Icon as={FiUser} boxSize={3} color="gray.400" />
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>{inv.customer_name}</Text>
                        </Flex>
                      </Flex>
                      <Flex flexDir="column" align="flex-end" gap={1} flexShrink={0}>
                        <Text fontSize="sm" fontWeight="bold" color="gray.800">
                          {formatAmount(inv.total_amount)}
                        </Text>
                        <Badge colorScheme={STATUS_COLOR[displayStatus] ?? "gray"} fontSize="10px" borderRadius="full" px={2} textTransform="capitalize">
                          {displayStatus}
                        </Badge>
                      </Flex>
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Card.Body>
        </Card.Root>

        {/* Recent Vendor Bills */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box w={1} h={4} bg="#E77A1F" borderRadius="full" />
                <Heading size="sm" color="gray.700">{t.erp_dashboard.recent_vendor_bills}</Heading>
              </Flex>
              <Text
                fontSize="xs" color="#E77A1F" cursor="pointer" fontWeight="medium"
                onClick={() => router.push("/bizgen/finance/see-all?type=payables")}
              >
                {t.erp_dashboard.view_all}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body pt={0}>
            {bills.length === 0 ? (
              <EmptyState label={t.erp_dashboard.no_vendor_bills} />
            ) : (
              <Box>
                {bills.map((bill, idx) => {
                  const overdue = isOverdue(bill.due_date, bill.bill_status);
                  const displayStatus = overdue ? "overdue" : bill.bill_status;
                  return (
                    <Flex
                      key={bill.vendor_bill_id}
                      justify="space-between"
                      align="center"
                      py={2.5}
                      borderBottom={idx < bills.length - 1 ? "1px solid" : "none"}
                      borderColor="gray.100"
                      gap={3}
                    >
                      <Flex flexDir="column" flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="semibold" color="gray.800" lineClamp={1}>
                          {bill.bill_no}
                        </Text>
                        <Flex align="center" gap={1}>
                          <Icon as={FiUser} boxSize={3} color="gray.400" />
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>{bill.supplier_name}</Text>
                        </Flex>
                      </Flex>
                      <Flex flexDir="column" align="flex-end" gap={1} flexShrink={0}>
                        <Text fontSize="sm" fontWeight="bold" color="gray.800">
                          {formatAmount(bill.total_amount)}
                        </Text>
                        <Badge colorScheme={STATUS_COLOR[displayStatus] ?? "gray"} fontSize="10px" borderRadius="full" px={2} textTransform="capitalize">
                          {displayStatus}
                        </Badge>
                      </Flex>
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* ── Sales & Purchase Activity ── */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={5} mt={5}>
        {/* Recent Quotations */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box w={1} h={4} bg="blue.400" borderRadius="full" />
                <Heading size="sm" color="gray.700">{t.erp_dashboard.recent_sales_quotations}</Heading>
              </Flex>
              <Text
                fontSize="xs" color="blue.500" cursor="pointer" fontWeight="medium"
                onClick={() => router.push("/bizgen/sales")}
              >
                {t.erp_dashboard.view_all}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body pt={0}>
            {quotations.length === 0 ? (
              <EmptyState label={t.erp_dashboard.no_quotations} />
            ) : (
              <Box>
                {quotations.map((q, idx) => (
                  <Flex
                    key={q.sales_quotation_id}
                    justify="space-between"
                    align="center"
                    py={2.5}
                    borderBottom={idx < quotations.length - 1 ? "1px solid" : "none"}
                    borderColor="gray.100"
                    gap={3}
                  >
                    <Flex flexDir="column" flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.800" lineClamp={1}>
                        {q.sales_quotation_number}
                      </Text>
                      <Flex align="center" gap={1}>
                        <Icon as={FiUser} boxSize={3} color="gray.400" />
                        <Text fontSize="xs" color="gray.500" lineClamp={1}>{q.customer_name}</Text>
                      </Flex>
                    </Flex>
                    <Flex flexDir="column" align="flex-end" gap={1} flexShrink={0}>
                      <Flex align="center" gap={1}>
                        <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                        <Text fontSize="xs" color="gray.400">{formatDate(q.created_at)}</Text>
                      </Flex>
                      <Badge colorScheme={STATUS_COLOR[q.quotation_status] ?? "gray"} fontSize="10px" borderRadius="full" px={2} textTransform="capitalize">
                        {q.quotation_status}
                      </Badge>
                    </Flex>
                  </Flex>
                ))}
              </Box>
            )}
          </Card.Body>
        </Card.Root>

        {/* Recent Purchase Requisitions */}
        <Card.Root variant="outline">
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box w={1} h={4} bg="purple.400" borderRadius="full" />
                <Heading size="sm" color="gray.700">{t.erp_dashboard.recent_purchase_requisitions}</Heading>
              </Flex>
              <Text
                fontSize="xs" color="purple.500" cursor="pointer" fontWeight="medium"
                onClick={() => router.push("/bizgen/purchase")}
              >
                {t.erp_dashboard.view_all}
              </Text>
            </Flex>
          </Card.Header>
          <Card.Body pt={0}>
            {requisitions.length === 0 ? (
              <EmptyState label={t.erp_dashboard.no_requisitions} />
            ) : (
              <Box>
                {requisitions.map((pr, idx) => (
                  <Flex
                    key={pr.pr_id}
                    justify="space-between"
                    align="center"
                    py={2.5}
                    borderBottom={idx < requisitions.length - 1 ? "1px solid" : "none"}
                    borderColor="gray.100"
                    gap={3}
                  >
                    <Flex flexDir="column" flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.800" lineClamp={1}>
                        {pr.pr_number}
                      </Text>
                      <Flex align="center" gap={1}>
                        <Icon as={FiShoppingCart} boxSize={3} color="gray.400" />
                        <Text fontSize="xs" color="gray.500" lineClamp={1}>
                          {pr.supplier_name || t.erp_dashboard.no_supplier}
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex flexDir="column" align="flex-end" gap={1} flexShrink={0}>
                      <Flex align="center" gap={1}>
                        <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                        <Text fontSize="xs" color="gray.400">{formatDate(pr.pr_date)}</Text>
                      </Flex>
                      <Badge colorScheme={STATUS_COLOR[pr.status] ?? "gray"} fontSize="10px" borderRadius="full" px={2} textTransform="capitalize">
                        {pr.priority !== "normal" ? `${pr.priority} · ` : ""}{pr.status}
                      </Badge>
                    </Flex>
                  </Flex>
                ))}
              </Box>
            )}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* ── Alert bar: things that need attention ── */}
      {((summary?.receivables.unpaid_receivables_overdue_count ?? 0) > 0 ||
        (summary?.payables.outstanding_vendor_bills_amount ?? 0) > 0) && (
        <Card.Root variant="outline" mt={5} borderColor="orange.200" bg="orange.50">
          <Card.Body>
            <Flex align="center" gap={3} flexWrap="wrap">
              <Icon as={FiAlertCircle} color="orange.500" boxSize={5} />
              <Text fontSize="sm" fontWeight="semibold" color="orange.700">{t.erp_dashboard.action_required}</Text>
              {(summary?.receivables.unpaid_receivables_overdue_count ?? 0) > 0 && (
                <Badge colorScheme="red" borderRadius="full" px={2} fontSize="xs">
                  {summary!.receivables.unpaid_receivables_overdue_count} {summary!.receivables.unpaid_receivables_overdue_count > 1 ? t.erp_dashboard.overdue_invoices : t.erp_dashboard.overdue_invoice}
                </Badge>
              )}
              {(summary?.payables.outstanding_vendor_bills_amount ?? 0) > 0 && (
                <Badge colorScheme="orange" borderRadius="full" px={2} fontSize="xs">
                  {formatAmount(summary!.payables.outstanding_vendor_bills_amount)} {t.erp_dashboard.vendor_bills_pending}
                </Badge>
              )}
            </Flex>
          </Card.Body>
        </Card.Root>
      )}
    </SidebarWithHeader>
  );
}

function KpiCard({
  label, value, sub, subColor, icon, iconColor, onClick,
}: {
  label: string; value: string; sub?: string; subColor?: string;
  icon: any; iconColor: string; onClick?: () => void;
}) {
  return (
    <Card.Root
      variant="outline" cursor={onClick ? "pointer" : "default"}
      _hover={onClick ? { shadow: "md", borderColor: "gray.300" } : {}}
      transition="all 0.15s"
      onClick={onClick}
    >
      <Card.Body>
        <Flex justify="space-between" align="flex-start">
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
            <Text fontSize="xl" fontWeight="bold" color="gray.800">{value}</Text>
            {sub && (
              <Text fontSize="xs" color={subColor ?? "gray.400"} mt={0.5}>{sub}</Text>
            )}
          </Box>
          <Icon as={icon} boxSize={6} color={iconColor} mt={1} />
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Flex justify="center" align="center" py={6} color="gray.400" flexDir="column" gap={1}>
      <Icon as={FiFileText} boxSize={5} />
      <Text fontSize="sm">{label}</Text>
    </Flex>
  );
}
