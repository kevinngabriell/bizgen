"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getGoodsReceipt, GetGoodsReceiptData } from "@/lib/purchase/goods-receipt";
import { getPurchaseImport, GetPurchaseImportData } from "@/lib/purchase/import";
import { getPurchaseInvoice, GetPurchaseInvoiceData } from "@/lib/purchase/invoice";
import { getPurchaseLocal, GetPurchaseLocalData } from "@/lib/purchase/local";
import { getPurchaseRequisition, GetPurchaseRequisitionData } from "@/lib/purchase/requisition";
import { Badge, Button, Card, Flex, Heading, Icon, SimpleGrid, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { JSX, useEffect, useState } from "react";
import { FiClipboard, FiDollarSign, FiGlobe, FiPackage, FiSearch, FiShoppingCart } from "react-icons/fi";

export default function Purchase() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // language state
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  // data state
  const [quotationData] = useState<never[]>([]);
  const [requisitionData, setRequisitionData] = useState<GetPurchaseRequisitionData[]>([]);
  const [localData, setLocalData] = useState<GetPurchaseLocalData[]>([]);
  const [importData, setImportData] = useState<GetPurchaseImportData[]>([]);
  const [goodsReceiptData, setGoodsReceiptData] = useState<GetGoodsReceiptData[]>([]);
  const [invoiceData, setInvoiceData] = useState<GetPurchaseInvoiceData[]>([]);

  // format date
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

    const valid = await checkAuthOrRedirect();
    if (!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    try {
      const [requisitionRes, localRes, importRes, goodsReceiptRes, invoiceRes] = await Promise.all([
        getPurchaseRequisition(1, 3),
        getPurchaseLocal(1, 3),
        getPurchaseImport(1, 3),
        getGoodsReceipt(1, 3),
        getPurchaseInvoice(1, 3),
      ]);
      setRequisitionData(requisitionRes.data);
      setLocalData(localRes.data);
      setImportData(importRes.data);
      setGoodsReceiptData(goodsReceiptRes.data);
      setInvoiceData(invoiceRes.data);
    } catch {
      // leave states empty on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  // navigation helpers
  const goTo = (path: string) => router.push(path);
  const goToSeeAll = (type: string) => router.push(`/bizgen/purchase/see-all?type=${type}`);

  // helper to render last-3 list with placeholder rows
  const renderList = (data: any[], renderItem: (item: any) => JSX.Element) => {
    if (!data || data.length === 0) {
      return (
        <Text fontSize="xs" color="gray.400" fontStyle="italic">
          No data available
        </Text>
      );
    }

    const filled = [...data];
    while (filled.length < 3) filled.push(null);

    return filled.map((item, index) => {
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

      {/* Title, subtitle, create new button */}
      <Flex gap={2} mb={2} mt="2" alignContent="center" justifyContent="space-between">
        <Flex flexDir="column">
          <Heading>{t.purchaseModule.title}</Heading>
          <Text fontSize="sm" color="gray.500" mb="8">{t.purchaseModule.subtitle}</Text>
        </Flex>
        <Button bg="#E77A1F" color="white" cursor="pointer">{t.purchaseModule.create_new}</Button>
      </Flex>

      {/* Grid for all cards */}
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} gap={8}>

        {/* Request for Quotation */}
        <Card.Root>
          <Card.Body>
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiSearch} />
              <Heading size="md" flex="1">{t.purchaseModule.request_quotation.title}</Heading>
              <Badge color="purple">{t.purchaseModule.request_quotation.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.purchaseModule.request_quotation.description}</Text>

            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.purchaseModule.request_quotation.last_records}</Text>
              <Flex direction="column" gap={1}>
                {renderList(quotationData, () => <></>)}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={() => goToSeeAll("quotation")}>{t.purchaseModule.request_quotation.see_all}</Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={() => goTo("/bizgen/purchase/request-quotation")}>{t.purchaseModule.request_quotation.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Requisition */}
        <Card.Root>
          <Card.Body>
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiClipboard} />
              <Heading size="md" flex="1">{t.purchaseModule.purchase_requisition.title}</Heading>
              <Badge color="blue">{t.purchaseModule.purchase_requisition.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.purchaseModule.purchase_requisition.description}</Text>

            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.purchaseModule.purchase_requisition.last_records}</Text>
              <Flex direction="column" gap={1}>
                {renderList(requisitionData, (pr) => (
                  <Flex key={pr.pr_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => goTo(`/bizgen/purchase/purchase-requisition?pr_id=${pr.pr_id}`)}>{pr.pr_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(pr.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={() => goToSeeAll("requisition")}>{t.purchaseModule.purchase_requisition.see_all}</Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={() => goTo("/bizgen/purchase/purchase-requisition")}>{t.purchaseModule.purchase_requisition.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Local */}
        <Card.Root>
          <Card.Body>
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiShoppingCart} />
              <Heading size="md" flex="1">{t.purchaseModule.purchase_local.title}</Heading>
              <Badge color="green">{t.purchaseModule.purchase_local.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.purchaseModule.purchase_local.description}</Text>

            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.purchaseModule.purchase_local.last_records}</Text>
              <Flex direction="column" gap={1}>
                {renderList(localData, (po) => (
                  <Flex key={po.purchase_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => goTo(`/bizgen/purchase/purchase-local?purchase_id=${po.purchase_id}`)}>{po.po_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(po.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={() => goToSeeAll("local")}>{t.purchaseModule.purchase_local.see_all}</Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={() => goTo("/bizgen/purchase/purchase-local")}>{t.purchaseModule.purchase_local.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Import */}
        <Card.Root>
          <Card.Body>
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiGlobe} />
              <Heading size="md" flex="1">{t.purchaseModule.purchase_import.title}</Heading>
              <Badge color="orange">{t.purchaseModule.purchase_import.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.purchaseModule.purchase_import.description}</Text>

            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.purchaseModule.purchase_import.last_records}</Text>
              <Flex direction="column" gap={1}>
                {renderList(importData, (po) => (
                  <Flex key={po.purchase_import_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => goTo(`/bizgen/purchase/purchase-import?purchase_import_id=${po.purchase_id}`)}>{po.po_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(po.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={() => goToSeeAll("import")}>{t.purchaseModule.purchase_import.see_all}</Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={() => goTo("/bizgen/purchase/purchase-import")}>{t.purchaseModule.purchase_import.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Receiving Items / GR */}
        <Card.Root>
          <Card.Body>
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiPackage} />
              <Heading size="md" flex="1">{t.purchaseModule.receiving_items.title}</Heading>
              <Badge color="teal">{t.purchaseModule.receiving_items.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.purchaseModule.receiving_items.description}</Text>

            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.purchaseModule.receiving_items.last_records}</Text>
              <Flex direction="column" gap={1}>
                {renderList(goodsReceiptData, (gr) => (
                  <Flex key={gr.receipt_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => goTo(`/bizgen/purchase/receiving-items?receipt_id=${gr.receipt_id}`)}>{gr.receipt_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(gr.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={() => goToSeeAll("goods_receipt")}>{t.purchaseModule.receiving_items.see_all}</Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={() => goTo("/bizgen/purchase/receiving-items")}>{t.purchaseModule.receiving_items.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Invoice */}
        <Card.Root>
          <Card.Body>
            <Flex align="center" mb="3" gap={2}>
              <Icon as={FiDollarSign} />
              <Heading size="md" flex="1">{t.purchaseModule.purchase_invoice.title}</Heading>
              <Badge color="pink">{t.purchaseModule.purchase_invoice.badge}</Badge>
            </Flex>
            <Text fontSize="sm" color="gray.600" mb="4">{t.purchaseModule.purchase_invoice.description}</Text>

            <Flex direction="column" gap={2} mb="3">
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">{t.purchaseModule.purchase_invoice.last_records}</Text>
              <Flex direction="column" gap={1}>
                {renderList(invoiceData, (inv) => (
                  <Flex key={inv.purchase_invoice_id} justify="space-between">
                    <Text fontSize="xs" color="gray.600" maxLines={1} onClick={() => goTo(`/bizgen/purchase/purchase-invoice?invoice_id=${inv.purchase_invoice_id}`)}>{inv.invoice_number}</Text>
                    <Badge colorScheme="gray" variant="subtle">{formatDate(inv.created_at)}</Badge>
                  </Flex>
                ))}
              </Flex>
            </Flex>

            <Flex justify="space-between">
              <Button size="sm" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={() => goToSeeAll("invoice")}>{t.purchaseModule.purchase_invoice.see_all}</Button>
              <Button size="sm" bg="#E77A1F" color="white" cursor="pointer" onClick={() => goTo("/bizgen/purchase/purchase-invoice")}>{t.purchaseModule.purchase_invoice.create}</Button>
            </Flex>
          </Card.Body>
        </Card.Root>

      </SimpleGrid>
    </SidebarWithHeader>
  );
}
