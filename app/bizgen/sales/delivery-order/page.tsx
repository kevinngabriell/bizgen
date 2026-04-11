'use client';

import Loading from '@/components/loading';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import SalesOrderLookup from '@/components/lookup/SalesOrderLookup';
import { AlertMessage } from '@/components/ui/alert';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, SALES_CREATE_ROLES, DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { GetCustomerData, getDetailCustomer } from '@/lib/master/customer';
import { getAllItem, GetItemData } from '@/lib/master/item';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import {
  createDeliveryOrder,
  generateSalesDeliveryNumber,
  getDetailDeliveryOrder,
  updateDeliveryOrder,
  processDeliveryOrderAction,
  GetDetailDeliveryHistory,
  UpdateDeliveryOrderItemData,
} from '@/lib/sales/delivery-order';
import { GetSalesOrderItemData, getDetailSalesOrder } from '@/lib/sales/sales-order';
import { getProfitBySalesOrderId } from '@/lib/sales/profit';
import RejectDialog from '@/components/dialog/RejectDialog';
import DataChangeConfirmDialog, { ItemChangeRow } from '@/components/dialog/DataChangeConfirmDialog';
import {
  Badge, Button, Card, Flex, Heading, Input, Text, Textarea, Field,
  Separator, NumberInput, SimpleGrid, Box, useListCollection, useFilter,
  createListCollection, Combobox, Portal, Select,
} from '@chakra-ui/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

type DeliveryMode = "create" | "view";

export default function CreateDeliveryOrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DeliveryOrderContent />
    </Suspense>
  );
}

function DeliveryOrderContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? "");
  const canCreate = SALES_CREATE_ROLES.has(auth?.app_role_id ?? "");

  const searchParams = useSearchParams();
  const deliveryOrderID = searchParams.get("delivery_order_id");
  const salesOrderIDParam = searchParams.get("sales_order_id");

  const [deliveryOrderStatus, setDeliveryOrderStatus] = useState<string>();
  const [deliveryOrderDetailId, setDeliveryOrderDetailId] = useState<string>("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();

  const [mode, setMode] = useState<DeliveryMode>("create");
  // Only lock when status is explicitly submitted or confirmed
  const isReadOnly = mode === "view" && (deliveryOrderStatus === "submitted" || deliveryOrderStatus === "confirmed");

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [isChangeConfirmOpen, setIsChangeConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ItemChangeRow[]>([]);
  const [pendingAction, setPendingAction] = useState<"create" | "update" | null>(null);
  const originalLineItems = useRef<{ itemName: string; qty: number; uomName: string }[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [profitSummaryExists, setProfitSummaryExists] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);

  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<GetSalesOrderItemData | null>(null);

  const [itemCollections, setItemCollections] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  });

  const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);

  const uomCollection = createListCollection({
    items: uomOptions.map((uom) => ({ label: uom.uom_name, value: uom.uom_id })),
  });

  const [doNumber, setDoNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [historyData, setHistoryData] = useState<GetDetailDeliveryHistory[]>([]);

  const showSuccess = (msg: string) => {
    setShowAlert(true); setIsSuccess(true);
    setTitlePopup(t.master.success); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const showError = (msg: string) => {
    setShowAlert(true); setIsSuccess(false);
    setTitlePopup(t.master.error); setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        await init();

        const [uomRes, itemRes] = await Promise.all([
          getAllUOM(1, 1000),
          getAllItem(1, 10000),
        ]);

        const itemData = itemRes?.data ?? [];
        setUOMOptions(uomRes?.data ?? []);
        setItemCollection(itemData);
        setItemCollections(itemData);

        if (salesOrderIDParam && !deliveryOrderID) {
          const numberRes = await generateSalesDeliveryNumber();
          setDoNumber(numberRes.number);
          await prefillFromSalesOrder(salesOrderIDParam, itemData, uomRes?.data ?? []);
        } else if (deliveryOrderID) {
          setMode("view");
          const res = await getDetailDeliveryOrder(deliveryOrderID);

          const header = res.header as any;
          setDeliveryOrderDetailId(header.delivery_order_id);
          // backend may return "do_number" or "delivery_order_no"
          setDoNumber(header.delivery_order_no || header.do_number || "");
          setIssueDate(header.issue_date ?? "");
          setDeliveryDate(header.delivery_date ?? "");
          setRemarks(header.remarks ?? "");
          // normalize to lowercase so comparisons work regardless of backend casing
          setDeliveryOrderStatus(header.status?.toLowerCase() ?? "");
          setLastUpdatedBy(header.updated_by ?? header.created_by);
          setLastUpdatedAt(header.updated_at ?? header.created_at);

          if (header.customer_id) {
            const customerRes = await getDetailCustomer(header.customer_id);
            if (customerRes.data.length > 0) {
              setSelectedCustomer(customerRes.data[0]);
            } else {
              setSelectedCustomer({
                customer_id: header.customer_id,
                customer_name: header.customer_name ?? "",
                customer_phone: "",
                customer_address: "",
                customer_pic_name: "",
                customer_pic_contact: "",
                customer_top: 0,
                created_by: "",
                created_at: "",
                updated_by: "",
                updated_at: "",
                company_id: "",
              });
            }
          } else {
            setSelectedCustomer({
              customer_id: "",
              customer_name: header.customer_name ?? "",
              customer_phone: "",
              customer_address: "",
              customer_pic_name: "",
              customer_pic_contact: "",
              customer_top: 0,
              created_by: "",
              created_at: "",
              updated_by: "",
              updated_at: "",
              company_id: "",
            });
          }

          setSelectedSalesOrder({
            sales_order_id: header.sales_order_id ?? "",
            sales_order_no: header.sales_order_no ?? header.sales_order_number ?? "",
            created_at: "",
          });

          setLineItems(
            res.items.map((item, idx) => ({
              id: Date.now() + idx,
              doItemId: item.item_id,
              itemId: item.items_id,
              itemName: item.item_name,
              description: item.item_name,
              qty: item.quantity,
              uom: item.uom_id,
              uomName: item.uom_name,
              notes: item.notes ?? "",
            }))
          );

          setHistoryData(res.history);

          if (header.sales_order_id) {
            const profitCheck = await getProfitBySalesOrderId(header.sales_order_id);
            setProfitSummaryExists(profitCheck?.exists || false);
          }
        } else {
          const res = await generateSalesDeliveryNumber();
          setDoNumber(res.number);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [deliveryOrderID, salesOrderIDParam]);

  const init = async () => {
    const valid = await checkAuthOrRedirect();
    if (!valid) return;
    const info = getAuthInfo();
    setAuth(info);
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);
  };

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), doItemId: '', itemId: '', itemName: '', description: '', qty: 1, uom: '', uomName: '', notes: '' },
  ]);

  const handleItemChange = (id: number, field: string, value: any) => {
    setLineItems(prev =>
      prev.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const addRow = () =>
    setLineItems(prev => [
      ...prev,
      { id: Date.now(), doItemId: '', itemId: '', itemName: '', description: '', qty: 1, uom: '', uomName: '', notes: '' },
    ]);

  const removeRow = (id: number) => {
    const target = lineItems.find(li => li.id === id);
    if (target?.doItemId) {
      setDeletedItemIds(prev => [...prev, target.doItemId]);
    }
    setLineItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  };

  const prefillFromSalesOrder = async (soId: string, itemData?: GetItemData[], uomData?: UOMData[]) => {
    const resolvedItems = itemData ?? itemCollections;
    const resolvedUoms = uomData ?? uomOptions;

    const res = await getDetailSalesOrder(soId);

    setSelectedSalesOrder({
      sales_order_id: soId,
      sales_order_no: res.header.sales_order_no,
      created_at: res.header.created_at ?? "",
    });

    if (res.header.customer_id) {
      const customerRes = await getDetailCustomer(res.header.customer_id);
      if (customerRes.data.length > 0) setSelectedCustomer(customerRes.data[0]);
    }

    const mappedItems = res.items.map((item, idx) => {
      const matchedItem = resolvedItems.find(i => i.item_id === item.item_id || i.item_name === item.item_name);
      const matchedUom = resolvedUoms.find(u => u.uom_name === item.uom_name);
      return {
        id: Date.now() + idx,
        doItemId: "",
        itemId: matchedItem?.item_id ?? "",
        itemName: item.item_name,
        description: item.item_name,
        qty: item.quantity,
        uom: matchedUom?.uom_id ?? "",
        uomName: item.uom_name,
        notes: "",
      };
    });

    setLineItems(mappedItems);
    originalLineItems.current = mappedItems.map(i => ({
      itemName: i.itemName,
      qty: i.qty,
      uomName: i.uomName,
    }));
  };

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };

  const handleChooseSalesOrder = async (sales_order: GetSalesOrderItemData) => {
    setSalesOrderModalOpen(false);
    await prefillFromSalesOrder(sales_order.sales_order_id);
  };

  const buildChanges = (): ItemChangeRow[] =>
    lineItems.map((li, idx) => {
      const orig = originalLineItems.current[idx];
      return {
        rowIndex: idx,
        description: {
          original: orig?.itemName ?? "",
          modified: li.itemName || li.description,
          changed: (li.itemName || li.description) !== (orig?.itemName ?? ""),
        },
        qty: {
          original: orig?.qty ?? 0,
          modified: li.qty,
          changed: li.qty !== (orig?.qty ?? 0),
        },
        uomName: {
          original: orig?.uomName ?? "",
          modified: li.uomName,
          changed: li.uomName !== (orig?.uomName ?? ""),
        },
      };
    });

  const handleSaveWithCheck = (action: "create" | "update") => {
    if (originalLineItems.current.length === 0) {
      action === "create" ? handleSubmit() : handleUpdate();
      return;
    }
    const changes = buildChanges();
    const hasDiff = changes.some(c => c.description.changed || c.qty.changed || c.uomName.changed);
    if (hasDiff) {
      setPendingChanges(changes);
      setPendingAction(action);
      setIsChangeConfirmOpen(true);
    } else {
      action === "create" ? handleSubmit() : handleUpdate();
    }
  };

  const handleConfirmChange = () => {
    setIsChangeConfirmOpen(false);
    if (pendingAction === "create") handleSubmit();
    else if (pendingAction === "update") handleUpdate();
    setPendingAction(null);
  };

  const handleExportPDF = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}sales/delivery-orders.php?action=export_pdf&delivery_id=${deliveryOrderDetailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to export PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showError(err.message || "Failed to export PDF.");
    }
  };

  const handleExportExcel = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}sales/delivery-orders.php?action=export_excel&delivery_id=${deliveryOrderDetailId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to export Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doNumber}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showError(err.message || "Failed to export Excel.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!doNumber) throw new Error(t.sales_delivery_order.error_1);
      if (!issueDate) throw new Error(t.sales_delivery_order.error_2);
      if (!selectedSalesOrder?.sales_order_id) throw new Error(t.sales_delivery_order.error_6);
      if (!selectedCustomer?.customer_id) throw new Error(t.sales_delivery_order.error_3);
      if (!deliveryDate) throw new Error(t.sales_delivery_order.error_4);
      if (lineItems.length === 0) throw new Error(t.sales_delivery_order.error_5);

      await createDeliveryOrder({
        do_number: doNumber,
        issue_date: issueDate,
        sales_order_id: selectedSalesOrder.sales_order_id,
        customer_id: selectedCustomer.customer_id,
        delivery_date: deliveryDate,
        remarks: remarks,
        items: lineItems.map((row) => ({
          items_id: row.itemId,
          quantity: String(row.qty),
          uom_id: row.uom,
          notes: row.notes || "",
        })),
      });

      showSuccess(t.sales_delivery_order.success_create);

      setSelectedCustomer(null);
      setSelectedSalesOrder(null);
      setDeliveryDate("");
      setIssueDate("");
      setRemarks("");
      setLineItems([{ id: Date.now(), doItemId: '', itemId: '', itemName: '', description: '', qty: 1, uom: '', uomName: '', notes: '' }]);

      try {
        const newNumber = await generateSalesDeliveryNumber();
        setDoNumber(newNumber.number);
      } catch (err) {
        console.error("Failed to regenerate delivery number", err);
      }
    } catch (err: any) {
      showError(err.message || t.sales_costing_expense.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!deliveryOrderDetailId) throw new Error("Delivery Order ID not found");
      setLoading(true);

      const itemsPayload: UpdateDeliveryOrderItemData[] = [
        ...deletedItemIds.map(id => ({ item_id: id, _delete: true as const })),
        ...lineItems.map(row => {
          if (row.doItemId) {
            return { item_id: row.doItemId, quantity: row.qty, notes: row.notes || "" };
          }
          return { items_id: row.itemId, quantity: row.qty, uom_id: row.uom, notes: row.notes || "" };
        }),
      ];

      await updateDeliveryOrder({
        delivery_id: deliveryOrderDetailId,
        issue_date: issueDate,
        delivery_date: deliveryDate,
        remarks: remarks,
        items: itemsPayload,
      });

      setDeletedItemIds([]);
      showSuccess(t.sales_delivery_order.success_update);
    } catch (err: any) {
      showError(err.message || "Failed to update delivery order.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDO = async () => {
    try {
      if (!deliveryOrderDetailId) throw new Error("Delivery Order ID not found");
      setLoading(true);

      await processDeliveryOrderAction({ delivery_id: deliveryOrderDetailId, action: "submit" });

      setDeliveryOrderStatus("submitted");
      showSuccess("Delivery order submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit delivery order.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!deliveryOrderDetailId) throw new Error("Delivery Order ID not found");
      setLoading(true);

      await processDeliveryOrderAction({ delivery_id: deliveryOrderDetailId, action: "approve" });

      setDeliveryOrderStatus("confirmed");
      showSuccess("Delivery order approved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to approve delivery order.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!deliveryOrderDetailId) throw new Error("Delivery Order ID not found");
      setRejectLoading(true);

      await processDeliveryOrderAction({ delivery_id: deliveryOrderDetailId, action: "reject", notes: reason });

      setIsRejectDialogOpen(false);
      setDeliveryOrderStatus("cancelled");
      showSuccess("Delivery order rejected successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to reject delivery order.");
    } finally {
      setRejectLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
        <Heading size="lg" mb={4}>
          {mode === "create" ? t.sales_delivery_order.title_create : t.sales_delivery_order.title_view}
        </Heading>

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
        <SalesOrderLookup isOpen={salesOrderModalOpen} onClose={() => setSalesOrderModalOpen(false)} onChoose={handleChooseSalesOrder} />

        {mode === "view" && (
          <Card.Root mb={4}>
            <Card.Body>
              <Flex justifyContent="space-between">
                <Badge
                  variant="solid"
                  colorPalette={
                    deliveryOrderStatus === "confirmed" ? "green"
                    : deliveryOrderStatus === "cancelled" ? "red"
                    : deliveryOrderStatus === "submitted" ? "blue"
                    : "yellow"
                  }
                >
                  {deliveryOrderStatus ? deliveryOrderStatus.charAt(0).toUpperCase() + deliveryOrderStatus.slice(1) : ""}
                </Badge>
                <Text fontSize="xs" color="gray.600">
                  {t.master.last_update_by} <b>{lastUpdatedBy || "System"}</b> • {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        <Card.Root>
          <Card.Header>
            <Heading size="md">{t.sales_delivery_order.document_information}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
              <Field.Root required>
                <Field.Label>{t.sales_delivery_order.do_number} <Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_delivery_order.do_number_placeholder}
                  value={doNumber}
                  readOnly={mode === "view"}
                  onChange={(e) => setDoNumber(e.target.value)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_delivery_order.issue_date}<Field.RequiredIndicator /></Field.Label>
                <Input type="date" value={issueDate} readOnly={isReadOnly} onChange={(e) => setIssueDate(e.target.value)} />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_delivery_order.reference}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_order.customer_placeholder}
                  value={selectedSalesOrder?.sales_order_no ?? ""}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setSalesOrderModalOpen(true)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_delivery_order.customer_name}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_order.customer_placeholder}
                  value={selectedCustomer?.customer_name ?? ""}
                  readOnly
                  cursor={mode === "view" ? "default" : "pointer"}
                  onClick={() => mode !== "view" && setCustomerModalOpen(true)}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_delivery_order.customer_info}</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short">
                  <Text>{selectedCustomer?.customer_address ?? "-"}</Text>
                  <Text>{selectedCustomer?.customer_phone ?? "-"}</Text>
                  <Text>TOP: {selectedCustomer?.customer_top ?? "-"}</Text>
                </Box>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_delivery_order.delivery_date}<Field.RequiredIndicator /></Field.Label>
                <Input type="date" value={deliveryDate} readOnly={isReadOnly} onChange={(e) => setDeliveryDate(e.target.value)} />
              </Field.Root>
            </SimpleGrid>

            <Separator mt={5} mb={5} />

            <Heading size="md" mb={4}>{t.sales_delivery_order.charges_items}</Heading>

            <Box overflowX="auto">
              {lineItems.map((li) => (
                <SimpleGrid key={li.id} templateColumns="300px 200px 250px 400px 200px" gap={6} mb={5}>
                  <Field.Root>
                    <Field.Label>{t.sales_delivery_order.description_label}</Field.Label>
                    {isReadOnly ? (
                      <Input value={li.itemName || li.description} readOnly />
                    ) : (
                      <Combobox.Root
                        key={`item-${li.id}`}
                        collection={itemCollection}
                        value={li.itemId ? [li.itemId] : []}
                        onValueChange={(details) => {
                          const selected = details.value?.[0] ?? '';
                          const matched = itemCollections.find(i => i.item_id === selected);
                          setLineItems(prev => prev.map(it => it.id === li.id ? {
                            ...it,
                            itemId: selected,
                            itemName: matched?.item_name ?? '',
                            description: matched?.item_name ?? '',
                          } : it));
                        }}
                        onInputValueChange={(e) => {
                          const input = e.inputValue ?? "";
                          if (!input || input.trim() === "") {
                            setItemCollection(itemCollections);
                            return;
                          }
                          const filtered = itemCollections.filter((item) =>
                            contains(`${item.item_code} - ${item.item_name}`, input)
                          );
                          setItemCollection(filtered);
                        }}
                      >
                        <Combobox.Control>
                          <Combobox.Input
                            placeholder={t.sales_order.product_name_placeholder}
                            onFocus={() => setItemCollection(itemCollections)}
                          />
                          <Combobox.IndicatorGroup>
                            <Combobox.ClearTrigger />
                            <Combobox.Trigger />
                          </Combobox.IndicatorGroup>
                        </Combobox.Control>
                        <Portal>
                          <Combobox.Positioner>
                            <Combobox.Content>
                              <Combobox.Empty>{t.sales_order.no_product}</Combobox.Empty>
                              {itemCollection.items.map((item) => (
                                <Combobox.Item item={item} key={item.item_id}>
                                  {item.item_code} - {item.item_name}
                                  <Combobox.ItemIndicator />
                                </Combobox.Item>
                              ))}
                            </Combobox.Content>
                          </Combobox.Positioner>
                        </Portal>
                      </Combobox.Root>
                    )}
                  </Field.Root>
                  <Field.Root w="100%">
                    <Field.Label>{t.sales_delivery_order.quantity}</Field.Label>
                    {isReadOnly ? (
                      <Input value={String(li.qty)} readOnly />
                    ) : (
                      <NumberInput.Root
                        w="100%"
                        value={String(li.qty)}
                        onValueChange={(details) => handleItemChange(li.id, 'qty', Number(details.value))}
                      >
                        <NumberInput.Control />
                        <NumberInput.Input />
                      </NumberInput.Root>
                    )}
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_delivery_order.uom}</Field.Label>
                    {isReadOnly ? (
                      <Input value={li.uomName} readOnly />
                    ) : (
                      <Select.Root
                        collection={uomCollection}
                        value={li.uom && uomCollection.items.some(i => i.value === li.uom) ? [li.uom] : []}
                        onValueChange={(details) => {
                          const selected = details.value?.[0] ?? '';
                          const matched = uomOptions.find(u => u.uom_id === selected);
                          setLineItems(prev => prev.map(it => it.id === li.id ? {
                            ...it,
                            uom: selected,
                            uomName: matched?.uom_name ?? '',
                          } : it));
                        }}
                        width="100%"
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={t.sales_inquiry.unit_placeholder} />
                          </Select.Trigger>
                          <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {uomCollection.items.map((uom) => (
                                <Select.Item item={uom} key={uom.value}>{uom.label}<Select.ItemIndicator /></Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t.sales_delivery_order.notes}</Field.Label>
                    <Input
                      value={li.notes}
                      readOnly={isReadOnly}
                      onChange={(e) => handleItemChange(li.id, 'notes', e.target.value)}
                      placeholder={t.sales_delivery_order.notes_placeholder}
                    />
                  </Field.Root>
                  {!isReadOnly && (
                    <Flex align="flex-end">
                      <Button borderColor="red" color="red" variant="ghost" onClick={() => removeRow(li.id)}>
                        {t.sales_delivery_order.remove}
                      </Button>
                    </Flex>
                  )}
                </SimpleGrid>
              ))}
            </Box>

            {!isReadOnly && (
              <Button mt={4} mb={4} onClick={addRow} variant="outline">{t.sales_delivery_order.add_item}</Button>
            )}

            <Field.Root mt={2}>
              <Field.Label>{t.sales_delivery_order.remarks}</Field.Label>
              <Textarea
                placeholder={t.sales_delivery_order.remarks_placeholder}
                value={remarks}
                readOnly={isReadOnly}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Field.Root>

            {/* Create mode */}
            {mode === "create" && canCreate && (
              <Flex justify="flex-end" gap={3} mt={4}>
                <Button variant="ghost">{t.sales_delivery_order.cancel}</Button>
                <Button bg="#E77A1F" color="white" cursor="pointer" onClick={() => handleSaveWithCheck("create")}>{t.sales_delivery_order.save}</Button>
              </Flex>
            )}

            {/* Draft or Cancelled: Save + Submit */}
            {(deliveryOrderStatus === "draft" || deliveryOrderStatus === "cancelled") && (
              <Flex justify="flex-end" gap={3} mt={4}>
                <Button variant="outline" onClick={() => handleSaveWithCheck("update")}>{t.master.save}</Button>
                <Button bg="#E77A1F" color="white" onClick={handleSubmitDO}>{t.master.submit}</Button>
              </Flex>
            )}

            {/* Submitted: Export PDF + Reject + Approve */}
            {deliveryOrderStatus === "submitted" && (
              <Flex gap={3} justifyContent="space-between" mt={4}>
                <Button variant="outline" onClick={handleExportPDF}>{t.master.export_pdf}</Button>
                <Flex gap={6}>
                  {canApprove && <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>{t.master.reject}</Button>}
                  {canApprove && <Button backgroundColor="green" onClick={handleApprove}>{t.master.approve}</Button>}
                </Flex>
              </Flex>
            )}

            {/* Confirmed: Export PDF + Export Excel + Create Profit Summary */}
            {deliveryOrderStatus === "confirmed" && (
              <Flex gap={3} justifyContent="space-between" mt={4}>
                <Flex gap={3}>
                  <Button variant="outline" onClick={handleExportPDF}>{t.master.export_pdf}</Button>
                  <Button variant="outline" onClick={handleExportExcel}>{t.master.export_excel}</Button>
                </Flex>
                {!profitSummaryExists && (
                  <Button
                    bg="#E77A1F"
                    color="white"
                    onClick={() => router.push(`/bizgen/sales/profit-summary?sales_order_id=${selectedSalesOrder?.sales_order_id}`)}
                  >
                    {t.sales_profit_summary.title_create}
                  </Button>
                )}
                {profitSummaryExists && (
                  <Text color="gray.600" fontSize="sm">{t.sales_profit_summary.title_view}</Text>
                )}
              </Flex>
            )}
          </Card.Body>
        </Card.Root>

        {/* History Log */}
        {mode === "view" && historyData.length > 0 && (
          <Card.Root mt={6}>
            <Card.Body>
              <Heading size="xl" mb={3}>History Log</Heading>
              {historyData.map((log, index) => (
                <Flex key={index} justify="space-between" mb={2}>
                  <Text fontSize="sm">
                    {log.note} by <b>{log.created_by}</b>
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString(
                          lang === "id" ? "id-ID" : "en-US",
                          { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
                        )
                      : "-"}
                  </Text>
                </Flex>
              ))}
            </Card.Body>
          </Card.Root>
        )}
      </SidebarWithHeader>

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
        lang={lang}
      />

      <DataChangeConfirmDialog
        isOpen={isChangeConfirmOpen}
        onClose={() => { setIsChangeConfirmOpen(false); setPendingAction(null); }}
        onConfirm={handleConfirmChange}
        changes={pendingChanges}
        lang={lang}
      />
    </>
  );
}
