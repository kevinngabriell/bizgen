"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { FinanceSummaryData, getFinanceSummary } from "@/lib/finance/finance";
import { InvoiceListItem, getInvoices } from "@/lib/finance/invoice";
import { VendorBillListItem, getVendorBills } from "@/lib/finance/vendor-bill";
import { Card, Flex, Heading, SimpleGrid, Text, Button, Badge, Icon, Box } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FiTrendingUp, FiTrendingDown, FiFileText, FiCreditCard, FiDollarSign,
  FiCalendar, FiUser, FiArrowUpRight,
} from "react-icons/fi";
import { getLang } from "@/lib/i18n";

const STATUS_COLOR: Record<string, string> = {
  draft: "gray.400",
  submitted: "orange.400",
  approved: "green.500",
  rejected: "red.500",
  paid: "blue.500",
  overdue: "red.600",
};

const STATUS_BADGE: Record<string, string> = {
  draft: "gray",
  submitted: "orange",
  approved: "green",
  rejected: "red",
  paid: "blue",
  overdue: "red",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatAmount(amount: number) {
  return `Rp ${Number(amount).toLocaleString("id-ID")}`;
}

function isDueSoon(dueDate: string): boolean {
  const due = new Date(dueDate);
  const today = new Date();
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

function isOverdue(dueDate: string, status: string): boolean {
  if (status === "paid") return false;
  return new Date(dueDate) < new Date();
}

export default function Finance() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [summary, setSummary] = useState<FinanceSummaryData | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceListItem[]>([]);
  const [recentVendorBills, setRecentVendorBills] = useState<VendorBillListItem[]>([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if (!valid) return;

    const info = getAuthInfo();
    setAuth(info);
    setLang(info?.language === "id" ? "id" : "en");

    try {
      const [summaryRes, invoicesRes, billsRes] = await Promise.all([
        getFinanceSummary(),
        getInvoices(1, 3, ''),
        getVendorBills(1, 3, ''),
      ]);
      setSummary(summaryRes);
      setRecentInvoices(invoicesRes.data);
      setRecentVendorBills(billsRes.data);
    } catch (error: any) {
      console.error("Failed fetch finance data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectToCreateInvoice = () => router.push('/bizgen/finance/create-invoice');
  const handleDirectToCreateVendorBill = () => router.push('/bizgen/finance/create-vendor-bill');
  const handleDirectToCreateIncome = () => router.push('/bizgen/finance/create-income');
  const handleDirectToCreateExpenses = () => router.push('/bizgen/finance/create-expenses');

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading size="lg">{t.finance_module.title}</Heading>

      {/* ── KPI strip ── */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
        <Card.Root variant="outline">
          <Card.Body>
            <Flex justify="space-between" align="center">
              <Flex flexDir="column">
                <Text fontSize="sm" color="gray.500">{t.finance_module.outstanding_receivables}</Text>
                <Heading size="md">{formatAmount(summary?.outstanding_receivables ?? 0)}</Heading>
              </Flex>
              <Icon as={FiTrendingUp} boxSize={6} color="green.400" />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root variant="outline">
          <Card.Body>
            <Flex justify="space-between" align="center">
              <Flex flexDir="column">
                <Text fontSize="sm" color="gray.500">{t.finance_module.outstanding_payables}</Text>
                <Heading size="md">{formatAmount(summary?.outstanding_payables ?? 0)}</Heading>
              </Flex>
              <Icon as={FiTrendingDown} boxSize={6} color="red.400" />
            </Flex>
          </Card.Body>
        </Card.Root>
        <Card.Root variant="outline">
          <Card.Body>
            <Flex justify="space-between" align="center">
              <Flex flexDir="column">
                <Text fontSize="sm" color="gray.500">{t.finance_module.cashflow_balance}</Text>
                <Heading size="md">{formatAmount(summary?.cashflow_balance ?? 0)}</Heading>
              </Flex>
              <Icon as={FiDollarSign} boxSize={6} color="blue.400" />
            </Flex>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* ── Accounts Receivable & Billing ── */}
      <Card.Root variant="outline" mt={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.finance_module.accounts_receivable_billing}</Heading>
            <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={handleDirectToCreateInvoice}>
              {t.finance_module.create_invoice}
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir="column">
                    <Text fontSize="sm" color="gray.500">{t.finance_module.customer_invoices}</Text>
                    <Heading size="sm">{summary?.receivables.customer_invoices_pending_count ?? 0} Docs</Heading>
                  </Flex>
                  <Icon as={FiFileText} />
                </Flex>
                <Badge mt={2} colorScheme="yellow">{t.finance_module.pending}</Badge>
              </Card.Body>
            </Card.Root>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir="column">
                    <Text fontSize="sm" color="gray.500">{t.finance_module.unpaid_receivables}</Text>
                    <Heading size="sm">{formatAmount(summary?.receivables.unpaid_receivables_overdue_amount ?? 0)}</Heading>
                  </Flex>
                  <Icon as={FiCreditCard} />
                </Flex>
                <Badge mt={2} colorScheme="red">{t.finance_module.overdue} {summary?.receivables.unpaid_receivables_overdue_count ?? 0}</Badge>
              </Card.Body>
            </Card.Root>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir="column">
                    <Text fontSize="sm" color="gray.500">{t.finance_module.payment_received}</Text>
                    <Heading size="sm">{formatAmount(summary?.receivables.payment_received_today_amount ?? 0)}</Heading>
                  </Flex>
                  <Icon as={FiDollarSign} />
                </Flex>
                <Badge mt={2} colorScheme="green">{t.finance_module.today} {summary?.receivables.payment_received_today_count ?? 0}</Badge>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Recent Invoices */}
          <Box mt={5}>
            <Flex justify="space-between" align="center" mb={3}>
              <Flex align="center" gap={2}>
                <Box w={1} h={4} bg="#E77A1F" borderRadius="full" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  {t.finance_module.recent_invoices}
                </Text>
              </Flex>
              <Text fontSize="xs" color="gray.400">{t.finance_module.latest_3}</Text>
            </Flex>

            {recentInvoices.length === 0 ? (
              <Flex
                align="center"
                justify="center"
                py={6}
                borderRadius="lg"
                border="1px dashed"
                borderColor="gray.200"
                flexDir="column"
                gap={1}
              >
                <Icon as={FiFileText} boxSize={5} color="gray.300" />
                <Text fontSize="sm" color="gray.400">{t.finance_module.no_invoices}</Text>
              </Flex>
            ) : (
              <Box borderRadius="lg" border="1px solid" borderColor="gray.100" overflow="hidden">
                {recentInvoices.map((inv, idx) => {
                  const overdue = isOverdue(inv.due_date, inv.status);
                  const dueSoon = isDueSoon(inv.due_date);
                  const displayStatus = overdue ? "overdue" : inv.status;

                  return (
                    <Box
                      key={inv.invoice_id}
                      px={4}
                      py={3}
                      borderBottom={idx < recentInvoices.length - 1 ? "1px solid" : "none"}
                      borderColor="gray.100"
                      bg="white"
                      _hover={{ bg: "orange.50" }}
                      transition="background 0.15s"
                      cursor="default"
                    >
                      <Flex justify="space-between" align="center" gap={4}>
                        {/* Left: status dot + doc info */}
                        <Flex align="center" gap={3} flex={1} minW={0}>
                          <Box
                            w={2}
                            h={2}
                            borderRadius="full"
                            bg={STATUS_COLOR[displayStatus] ?? "gray.400"}
                            flexShrink={0}
                            mt="1px"
                          />
                          <Flex flexDir="column" minW={0}>
                            <Text fontWeight="semibold" fontSize="sm" color="gray.800" lineClamp={1}>
                              {inv.invoice_no}
                            </Text>
                            <Flex align="center" gap={1} mt={0.5}>
                              <Icon as={FiUser} boxSize={3} color="gray.400" />
                              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                                {inv.customer_name}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>

                        {/* Center: date info */}
                        <Flex flexDir="column" align="flex-start" display={{ base: "none", md: "flex" }} minW="140px" gap={1}>
                          <Flex align="center" gap={1}>
                            <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                            <Text fontSize="xs" color="gray.500">{formatDate(inv.invoice_date)}</Text>
                          </Flex>
                          <Text fontSize="xs" color={overdue ? "red.500" : dueSoon ? "orange.500" : "gray.400"}>
                            {t.finance_module.due} {formatDate(inv.due_date)}
                          </Text>
                        </Flex>

                        {/* Right: amount + badge */}
                        <Flex flexDir="column" align="flex-end" gap={1} flexShrink={0}>
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">
                            {formatAmount(inv.total_amount)}
                          </Text>
                          <Badge
                            colorScheme={STATUS_BADGE[displayStatus] ?? "gray"}
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            textTransform="capitalize"
                          >
                            {displayStatus}
                          </Badge>
                        </Flex>
                      </Flex>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Card.Body>
        <Card.Footer>
          <Button
            variant="ghost"
            size="sm"
            cursor="pointer"
            onClick={() => router.push('/bizgen/finance/see-all?type=receivables')}
          >
            {t.finance_module.view_all_receivables}
          </Button>
        </Card.Footer>
      </Card.Root>

      {/* ── Accounts Payable & Vendor Bills ── */}
      <Card.Root variant="outline" mt={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.finance_module.accounts_payable_vendor_bills}</Heading>
            <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={handleDirectToCreateVendorBill}>
              {t.finance_module.add_vendor_bill}
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Card.Root shadow="xs">
              <Card.Body>
                <Text fontSize="sm" color="gray.500">{t.finance_module.outstanding_vendor_bills}</Text>
                <Heading size="sm">{formatAmount(summary?.payables.outstanding_vendor_bills_amount ?? 0)}</Heading>
                <Badge mt={2} colorScheme="orange">{t.finance_module.awaiting_payment}</Badge>
              </Card.Body>
            </Card.Root>
            <Card.Root shadow="xs">
              <Card.Body>
                <Text fontSize="sm" color="gray.500">{t.finance_module.approved_expenses}</Text>
                <Heading size="sm">{formatAmount(summary?.payables.approved_expenses_amount ?? 0)}</Heading>
                <Badge mt={2} colorScheme="blue">{t.finance_module.processing}</Badge>
              </Card.Body>
            </Card.Root>
            <Card.Root shadow="xs">
              <Card.Body>
                <Text fontSize="sm" color="gray.500">{t.finance_module.paid_bills}</Text>
                <Heading size="sm">{formatAmount(summary?.payables.paid_bills_amount ?? 0)}</Heading>
                <Badge mt={2} colorScheme="green">{t.finance_module.completed}</Badge>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Recent Vendor Bills */}
          <Box mt={5}>
            <Flex justify="space-between" align="center" mb={3}>
              <Flex align="center" gap={2}>
                <Box w={1} h={4} bg="#E77A1F" borderRadius="full" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  {t.finance_module.recent_vendor_bills}
                </Text>
              </Flex>
              <Text fontSize="xs" color="gray.400">{t.finance_module.latest_3}</Text>
            </Flex>

            {recentVendorBills.length === 0 ? (
              <Flex
                align="center"
                justify="center"
                py={6}
                borderRadius="lg"
                border="1px dashed"
                borderColor="gray.200"
                flexDir="column"
                gap={1}
              >
                <Icon as={FiCreditCard} boxSize={5} color="gray.300" />
                <Text fontSize="sm" color="gray.400">{t.finance_module.no_vendor_bills}</Text>
              </Flex>
            ) : (
              <Box borderRadius="lg" border="1px solid" borderColor="gray.100" overflow="hidden">
                {recentVendorBills.map((bill, idx) => {
                  const overdue = isOverdue(bill.due_date, bill.bill_status);
                  const dueSoon = isDueSoon(bill.due_date);
                  const displayStatus = overdue ? "overdue" : bill.bill_status;

                  return (
                    <Box
                      key={bill.vendor_bill_id}
                      px={4}
                      py={3}
                      borderBottom={idx < recentVendorBills.length - 1 ? "1px solid" : "none"}
                      borderColor="gray.100"
                      bg="white"
                      _hover={{ bg: "orange.50" }}
                      transition="background 0.15s"
                      cursor="default"
                    >
                      <Flex justify="space-between" align="center" gap={4}>
                        {/* Left: status dot + doc info */}
                        <Flex align="center" gap={3} flex={1} minW={0}>
                          <Box
                            w={2}
                            h={2}
                            borderRadius="full"
                            bg={STATUS_COLOR[displayStatus] ?? "gray.400"}
                            flexShrink={0}
                            mt="1px"
                          />
                          <Flex flexDir="column" minW={0}>
                            <Text fontWeight="semibold" fontSize="sm" color="gray.800" lineClamp={1}>
                              {bill.bill_no}
                            </Text>
                            <Flex align="center" gap={1} mt={0.5}>
                              <Icon as={FiUser} boxSize={3} color="gray.400" />
                              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                                {bill.supplier_name}
                              </Text>
                            </Flex>
                          </Flex>
                        </Flex>

                        {/* Center: date info */}
                        <Flex flexDir="column" align="flex-start" display={{ base: "none", md: "flex" }} minW="140px" gap={1}>
                          <Flex align="center" gap={1}>
                            <Icon as={FiCalendar} boxSize={3} color="gray.400" />
                            <Text fontSize="xs" color="gray.500">{formatDate(bill.bill_date)}</Text>
                          </Flex>
                          <Text fontSize="xs" color={overdue ? "red.500" : dueSoon ? "orange.500" : "gray.400"}>
                            {t.finance_module.due} {formatDate(bill.due_date)}
                          </Text>
                        </Flex>

                        {/* Right: amount + badge */}
                        <Flex flexDir="column" align="flex-end" gap={1} flexShrink={0}>
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">
                            {formatAmount(bill.total_amount)}
                          </Text>
                          <Badge
                            colorScheme={STATUS_BADGE[displayStatus] ?? "gray"}
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            textTransform="capitalize"
                          >
                            {displayStatus}
                          </Badge>
                        </Flex>
                      </Flex>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Card.Body>
        <Card.Footer>
          <Button
            variant="ghost"
            size="sm"
            cursor="pointer"
            onClick={() => router.push('/bizgen/finance/see-all?type=payables')}
          >
            {t.finance_module.view_all_payables}
          </Button>
        </Card.Footer>
      </Card.Root>

      {/* ── Cashflow & Ledger Overview ── */}
      <Card.Root variant="outline" mt={5}>
        <Card.Body>
          <Heading size="md" mb={2}>{t.finance_module.cashflow_ledger_overview}</Heading>
          <Text fontSize="sm" color="gray.600">
            {t.finance_module.cashflow_ledger_desc} {t.finance_module.cashflow_ledger_next}
          </Text>
        </Card.Body>
      </Card.Root>

      {/* ── Operational Income & Expenses ── */}
      <Card.Root variant="outline" mt={5}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.finance_module.operational_income_expenses}</Heading>
            <Flex gap={2}>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={handleDirectToCreateIncome}>
                {t.finance_module.add_income}
              </Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={handleDirectToCreateExpenses}>
                {t.finance_module.add_expense}
              </Button>
            </Flex>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir="column">
                    <Text fontSize="sm" color="gray.500">{t.finance_module.total_income}</Text>
                    <Heading size="sm">
                      {summary?.income_expense.map((s) => `${s.currency_symbol} ${Number(s.total_income).toLocaleString()}`).join(" | ") || "Rp 0"}
                    </Heading>
                  </Flex>
                  <Icon as={FiTrendingUp} color="green.400" />
                </Flex>
                <Badge mt={2} colorScheme="green">{t.finance_module.this_month}</Badge>
              </Card.Body>
            </Card.Root>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir="column">
                    <Text fontSize="sm" color="gray.500">{t.finance_module.total_expenses}</Text>
                    <Heading size="sm">
                      {summary?.income_expense.map((s) => `${s.currency_symbol} ${Number(s.total_expense).toLocaleString()}`).join(" | ") || "Rp 0"}
                    </Heading>
                  </Flex>
                  <Icon as={FiTrendingUp} color="red.400" />
                </Flex>
                <Badge mt={2} colorScheme="red">{t.finance_module.this_month}</Badge>
              </Card.Body>
            </Card.Root>
            <Card.Root shadow="xs">
              <Card.Body>
                <Flex justify="space-between" align="center">
                  <Flex flexDir="column">
                    <Text fontSize="sm" color="gray.500">{t.finance_module.net_operating_balance}</Text>
                    <Heading size="sm">
                      {summary?.income_expense.map((s) => `${s.currency_symbol} ${Number(s.net_balance).toLocaleString()}`).join(" | ") || "Rp 0"}
                    </Heading>
                  </Flex>
                  <Icon as={FiTrendingUp} color="blue.400" />
                </Flex>
                <Badge mt={2} colorScheme="blue">{t.finance_module.auto_calculated}</Badge>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Card.Body>
        <Card.Footer>
          <Button
            variant="ghost"
            size="sm"
            cursor="pointer"
            onClick={() => router.push('/bizgen/finance/see-all?type=income_ledger')}
          >
            {t.finance_module.view_income_expense_ledger}
          </Button>
        </Card.Footer>
      </Card.Root>
    </SidebarWithHeader>
  );
}
