"use client";

import Loading from "@/components/loading";
import SupplierLookup from "@/components/lookup/SupplierLookup";
import RejectDialog from "@/components/dialog/RejectDialog";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { SALES_APPROVAL_ROLES, DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { getAllItem, GetItemData } from "@/lib/master/item";
import { GetSupplierData } from "@/lib/master/supplier";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import {
  createPurchaseRequisition,
  generatePurchaseRequisitionNumber,
  getPurchaseRequisitionDetail,
  updatePurchaseRequisition,
  processPurchaseRequisitionAction,
  GetPurchaseRequisitionHistoryDetailData,
} from "@/lib/purchase/requisition";
import {
  Badge,
  Box,
  Button,
  Card,
  Combobox,
  createListCollection,
  Field,
  Flex,
  Heading,
  IconButton,
  Input,
  Portal,
  Select,
  Separator,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaTrash } from "react-icons/fa";

const BIZGEN_COLOR = "#E77A1F";

type ReqMode = 'create' | 'view';

type RequisitionItem = {
  id: string;
  displayName: string;
  item_id: string;
  quantity: string;
  uom_id: string;
  estimated_price: string;
  remarks: string;
};

const priorityOptions = createListCollection({
  items: [
    { label: "Normal", value: "normal" },
    { label: "Urgent", value: "urgent" },
    { label: "Critical", value: "critical" },
  ],
});

const categoryOptions = createListCollection({
  items: [
    { label: "Operational Supplies", value: "operational_supplies" },
    { label: "Office Supplies", value: "office_supplies" },
    { label: "IT Equipment", value: "it_equipment" },
    { label: "Logistics Equipment", value: "logistics_equipment" },
    { label: "Services", value: "services" },
    { label: "Other", value: "other" },
  ],
});

function newItem(): RequisitionItem {
  return { id: crypto.randomUUID(), displayName: "", item_id: "", quantity: "", uom_id: "", estimated_price: "", remarks: "" };
}

export default function PurchaseRequisitionCreatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseRequisitionContent />
    </Suspense>
  );
}

function PurchaseRequisitionContent() {
  const searchParams = useSearchParams();
  const prId = searchParams.get("pr_id");

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);
  const tr = t.purchase_requisition;

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? "");

  const [mode, setMode] = useState<ReqMode>("create");
  const [reqId, setReqId] = useState("");
  const [reqStatus, setReqStatus] = useState("");
  const [historyData, setHistoryData] = useState<GetPurchaseRequisitionHistoryDetailData[]>([]);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState("");
  const [messagePopup, setMessagePopup] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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

  const [prioritySelected, setPrioritySelected] = useState<string>();
  const [categorySelected, setCategorySelected] = useState<string>();
  const [currencySelected, setCurrencySelected] = useState<string>();

  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);

  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" });
  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  });

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({ label: `${c.currency_code} — ${c.currency_name}`, value: c.currency_id })),
  });
  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });

  const selectedCurrencyCode = currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? "";

  const [form, setForm] = useState({
    pr_number: "",
    pr_date: "",
    requester: "",
    department: "",
    needed_by: "",
    notes: "",
  });

  const [items, setItems] = useState<RequisitionItem[]>([newItem()]);

  const isReadOnly = mode === "view" && (reqStatus === "submitted" || reqStatus === "approved");

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === "id" ? "id" : "en");

        const [currencyRes, uomRes, itemRes] = await Promise.all([
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllItem(1, 10000),
        ]);

        const currencyData = currencyRes?.data ?? [];
        const uomData = uomRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setCurrencyOptions(currencyData);
        setUomOptions(uomData);
        setItemMasterAll(itemData);
        setItemCollection(itemData);

        if (prId) {
          setMode("view");
          const detail = await getPurchaseRequisitionDetail(prId);
          const h = detail.header;

          setReqId(h.pr_id);
          setReqStatus(h.status);
          setHistoryData(detail.history);

          setForm({
            pr_number: h.pr_number,
            pr_date: h.pr_date,
            requester: h.requester_name,
            department: h.department,
            needed_by: h.deadline_date ?? "",
            notes: "",
          });

          setPrioritySelected(h.priority);
          setCategorySelected(h.category);

          const currency = currencyData.find((c) => c.currency_code === h.currency_code);
          if (currency) setCurrencySelected(currency.currency_id);

          setSelectedSupplier({ supplier_name: h.supplier_name } as GetSupplierData);

          setItems(
            detail.items.map((item) => {
              const found = itemData.find((i) => i.item_id === item.item_id);
              return {
                id: crypto.randomUUID(),
                displayName: found ? `${found.item_code} - ${found.item_name}` : item.item_name,
                item_id: item.item_id,
                quantity: item.quantity ?? "",
                uom_id: item.uom_id ?? "",
                estimated_price: item.estimated_price ?? "",
                remarks: item.remarks ?? "",
              };
            })
          );
        } else {
          const prNumberRes = await generatePurchaseRequisitionNumber();
          setForm((prev) => ({ ...prev, pr_number: prNumberRes.number }));
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [prId]);

  const handleItemChange = (id: string, field: keyof RequisitionItem, value: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.id !== id)));
  };

  const computeSubtotal = (item: RequisitionItem) =>
    ((parseFloat(item.quantity) || 0) * (parseFloat(item.estimated_price) || 0)).toLocaleString();

  const grandTotal = items.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.estimated_price) || 0),
    0
  );

  const handleChooseSupplier = (supplier: GetSupplierData) => {
    setSelectedSupplier(supplier);
    setSupplierModalOpen(false);
  };

  const validateForm = () => {
    if (!form.pr_number) throw new Error(tr.error_pr_number);
    if (!form.pr_date) throw new Error(tr.error_pr_date);
    if (!form.requester) throw new Error(tr.error_requester);
    if (!form.department) throw new Error(tr.error_department);
    if (!currencySelected) throw new Error(tr.error_currency);
    if (!items.some((it) => it.item_id.trim())) throw new Error(tr.error_items);
    const invalid = items.find(
      (it) => !it.item_id.trim() || !it.uom_id.trim() || it.quantity === "" || parseFloat(it.quantity) < 0
    );
    if (invalid) throw new Error(tr.error_item_fields);
  };

  const buildPayloadItems = () =>
    items.map(({ id: _id, displayName: _dn, ...rest }) => ({
      item_id: rest.item_id,
      quantity: Number(rest.quantity),
      uom_id: rest.uom_id,
      estimated_price: Number(rest.estimated_price),
      remarks: rest.remarks,
    }));

  const resetForm = async () => {
    const res = await generatePurchaseRequisitionNumber();
    setForm({ pr_number: res.number, pr_date: "", requester: "", department: "", needed_by: "", notes: "" });
    setPrioritySelected(undefined);
    setCategorySelected(undefined);
    setCurrencySelected(undefined);
    setSelectedSupplier(null);
    setItems([newItem()]);
  };

  const handleSaveDraft = async () => {
    try {
      validateForm();
      setLoading(true);
      await createPurchaseRequisition({
        pr_number: form.pr_number,
        pr_date: form.pr_date,
        requester_name: form.requester,
        department: form.department,
        priority: (prioritySelected ?? "normal") as "normal" | "urgent" | "critical",
        category: (categorySelected ?? "other") as any,
        deadline_date: form.needed_by,
        supplier_id: selectedSupplier?.supplier_id ?? "",
        currency_id: currencySelected ?? "",
        notes: form.notes,
        items: buildPayloadItems(),
      });
      showSuccess(tr.success_draft);
      await resetForm();
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndSubmit = async () => {
    try {
      validateForm();
      setLoading(true);
      const res = await createPurchaseRequisition({
        pr_number: form.pr_number,
        pr_date: form.pr_date,
        requester_name: form.requester,
        department: form.department,
        priority: (prioritySelected ?? "normal") as "normal" | "urgent" | "critical",
        category: (categorySelected ?? "other") as any,
        deadline_date: form.needed_by,
        supplier_id: selectedSupplier?.supplier_id ?? "",
        currency_id: currencySelected ?? "",
        notes: form.notes,
        items: buildPayloadItems(),
      });
      const newId = res?.data?.pr_id ?? res?.pr_id ?? "";
      if (newId) {
        await processPurchaseRequisitionAction({ pr_id: newId, action: "submit" });
      }
      showSuccess(tr.success_submit);
      await resetForm();
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updatePurchaseRequisition({
        pr_id: reqId,
        pr_date: form.pr_date,
        requester_name: form.requester,
        department: form.department,
        priority: prioritySelected as any,
        category: categorySelected as any,
        deadline_date: form.needed_by,
        supplier_id: selectedSupplier?.supplier_id,
        currency_id: currencySelected,
        notes: form.notes,
        items: buildPayloadItems(),
      });
      setReqStatus("draft");
      showSuccess(tr.success_draft);
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAction = async () => {
    try {
      setLoading(true);
      await processPurchaseRequisitionAction({ pr_id: reqId, action: "submit" });
      setReqStatus("submitted");
      showSuccess(tr.success_submit);
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await processPurchaseRequisitionAction({ pr_id: reqId, action: "approve" });
      setReqStatus("approved");
      showSuccess("Purchase Requisition approved.");
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setRejectLoading(true);
      await processPurchaseRequisitionAction({ pr_id: reqId, action: "reject", notes: reason });
      setReqStatus("rejected");
      setIsRejectDialogOpen(false);
      showSuccess("Purchase Requisition rejected.");
    } catch (err: any) {
      showError(err.message || t.master.error_msg);
    } finally {
      setRejectLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; colorPalette: string }> = {
      draft:     { label: "Draft",     colorPalette: "yellow" },
      submitted: { label: "Submitted", colorPalette: "blue"   },
      approved:  { label: "Approved",  colorPalette: "green"  },
      rejected:  { label: "Rejected",  colorPalette: "red"    },
    };
    const s = map[status] ?? { label: status, colorPalette: "gray" };
    return <Badge colorPalette={s.colorPalette} variant="subtle" ml={3}>{s.label}</Badge>;
  };

  const ActionButtons = () => {
    if (mode === "create") {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleSaveDraft} loading={loading}>
            {tr.save_draft}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleCreateAndSubmit} loading={loading}>
            {tr.submit}
          </Button>
        </Flex>
      );
    }
    if (reqStatus === "draft" || reqStatus === "rejected") {
      return (
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={handleUpdate} loading={loading}>
            Update
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleSubmitAction} loading={loading}>
            Submit
          </Button>
        </Flex>
      );
    }
    if (reqStatus === "submitted" && canApprove) {
      return (
        <Flex gap={3}>
          <Button variant="outline" colorPalette="red" onClick={() => setIsRejectDialogOpen(true)}>
            Reject
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={handleApprove} loading={loading}>
            Approve
          </Button>
        </Flex>
      );
    }
    return null;
  };

  if (loading && mode === "create") return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir="column">
          <Flex align="center">
            <Heading size="lg">{tr.title}</Heading>
            {mode === "view" && statusBadge(reqStatus)}
          </Flex>
          <Text color="gray.500" fontSize="sm">{tr.subtitle}</Text>
        </Flex>
        <ActionButtons />
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      <SupplierLookup
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onChoose={handleChooseSupplier}
      />

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      <Stack gap={6}>
        {/* Requisition Details */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{tr.requisition_details}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root required>
                <Field.Label>{tr.pr_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.pr_number}
                  onChange={(e) => setForm({ ...form, pr_number: e.target.value })}
                  placeholder={tr.pr_number_placeholder}
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{tr.pr_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  value={form.pr_date}
                  onChange={(e) => setForm({ ...form, pr_date: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{tr.requester}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.requester}
                  onChange={(e) => setForm({ ...form, requester: e.target.value })}
                  placeholder={tr.requester_placeholder}
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{tr.department}<Field.RequiredIndicator /></Field.Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder={tr.department_placeholder}
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>{tr.priority}</Field.Label>
                <Select.Root
                  collection={priorityOptions}
                  value={prioritySelected ? [prioritySelected] : []}
                  onValueChange={(d) => setPrioritySelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.priority_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {priorityOptions.items.map((opt) => (
                          <Select.Item item={opt} key={opt.value}>{opt.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>{tr.category}</Field.Label>
                <Select.Root
                  collection={categoryOptions}
                  value={categorySelected ? [categorySelected] : []}
                  onValueChange={(d) => setCategorySelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.category_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {categoryOptions.items.map((opt) => (
                          <Select.Item item={opt} key={opt.value}>{opt.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>{tr.needed_by}</Field.Label>
                <Input
                  type="date"
                  value={form.needed_by}
                  onChange={(e) => setForm({ ...form, needed_by: e.target.value })}
                  readOnly={isReadOnly}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>{tr.preferred_vendor}</Field.Label>
                <Input
                  value={selectedSupplier?.supplier_name ?? ""}
                  readOnly
                  cursor={isReadOnly ? "default" : "pointer"}
                  placeholder={tr.preferred_vendor_placeholder}
                  onClick={() => !isReadOnly && setSupplierModalOpen(true)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{tr.currency}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(d) => setCurrencySelected(d.value[0])}
                  disabled={isReadOnly}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={tr.currency_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {currencyCollection.items.map((opt) => (
                          <Select.Item item={opt} key={opt.value}>{opt.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
            </SimpleGrid>

            <Field.Root mt={4}>
              <Field.Label>{tr.notes}</Field.Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={tr.notes_placeholder}
                readOnly={isReadOnly}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Requested Items */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.requested_items}</Heading>
              {!isReadOnly && (
                <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={addItem}>
                  {tr.add_item}
                </Button>
              )}
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              <Flex minW="1260px" gap={3} mb={2} px={1}>
                <Box w="32px" flexShrink={0} />
                <Box w="260px" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{tr.description}</Text>
                </Box>
                <Box w="100px" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{tr.qty}</Text>
                </Box>
                <Box w="160px" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{tr.uom}</Text>
                </Box>
                <Box w="160px" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{tr.est_price}</Text>
                </Box>
                <Box w="160px" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                    {tr.subtotal}{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ""}
                  </Text>
                </Box>
                <Box w="220px" flexShrink={0}>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{tr.remarks}</Text>
                </Box>
                <Box w="40px" flexShrink={0} />
              </Flex>

              {items.map((item, idx) => (
                <Flex key={item.id} minW="1260px" gap={3} mb={3} align="center" px={1}>
                  <Box w="32px" flexShrink={0}>
                    <Text color="gray.400">{idx + 1}</Text>
                  </Box>
                  <Box w="260px" flexShrink={0}>
                    <Combobox.Root
                      collection={itemCollection}
                      onValueChange={(d) => {
                        const selected = d.value?.[0] ?? "";
                        const found = itemMasterAll.find((i) => i.item_id === selected);
                        if (found) {
                          handleItemChange(item.id, "item_id", found.item_id);
                          handleItemChange(item.id, "displayName", `${found.item_code} - ${found.item_name}`);
                        }
                      }}
                      onInputValueChange={(e) => {
                        const input = e.inputValue ?? "";
                        handleItemChange(item.id, "displayName", input);
                        if (!input.trim()) { setItemCollection(itemMasterAll); return; }
                        setItemCollection(itemMasterAll.filter((i) => contains(`${i.item_code} - ${i.item_name}`, input)));
                      }}
                      disabled={isReadOnly}
                    >
                      <Combobox.Control>
                        <Combobox.Input
                          placeholder={tr.description_placeholder}
                          value={item.displayName}
                          onFocus={() => setItemCollection(itemMasterAll)}
                        />
                        <Combobox.IndicatorGroup>
                          {!isReadOnly && (
                            <Combobox.ClearTrigger onClick={() => { handleItemChange(item.id, "item_id", ""); handleItemChange(item.id, "displayName", ""); }} />
                          )}
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>No items found</Combobox.Empty>
                            {itemCollection.items.map((i) => (
                              <Combobox.Item item={i} key={i.item_id}>
                                {i.item_code} - {i.item_name}<Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                  </Box>
                  <Box w="100px" flexShrink={0}>
                    <Input type="number" placeholder="0" min={0} value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="160px" flexShrink={0}>
                    <Select.Root
                      collection={uomCollection}
                      value={item.uom_id ? [item.uom_id] : []}
                      onValueChange={(d) => handleItemChange(item.id, "uom_id", d.value[0])}
                      width="100%"
                      disabled={isReadOnly}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={tr.uom_placeholder} />
                        </Select.Trigger>
                        <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {uomCollection.items.map((u) => (
                              <Select.Item item={u} key={u.value}>{u.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Box>
                  <Box w="160px" flexShrink={0}>
                    <Input type="number" placeholder="0" value={item.estimated_price}
                      onChange={(e) => handleItemChange(item.id, "estimated_price", e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="160px" flexShrink={0}>
                    <Input value={computeSubtotal(item)} readOnly bg="gray.50" />
                  </Box>
                  <Box w="220px" flexShrink={0}>
                    <Input placeholder={tr.remarks_placeholder} value={item.remarks}
                      onChange={(e) => handleItemChange(item.id, "remarks", e.target.value)} readOnly={isReadOnly} />
                  </Box>
                  <Box w="40px" flexShrink={0}>
                    {!isReadOnly && (
                      <IconButton aria-label="Remove item" variant="ghost" color="red.500" size="sm" onClick={() => removeItem(item.id)}>
                        <FaTrash />
                      </IconButton>
                    )}
                  </Box>
                </Flex>
              ))}

              <Separator mt={2} mb={3} />
              <Flex justify="flex-end" minW="1260px" pr={1}>
                <Flex align="center" gap={3}>
                  <Text fontWeight="bold">
                    {tr.subtotal} Total{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ""}
                  </Text>
                  <Input value={grandTotal.toLocaleString()} readOnly bg="gray.50" fontWeight="bold" w="160px" textAlign="right" />
                </Flex>
              </Flex>
            </Box>
          </Card.Body>
        </Card.Root>

        {/* History */}
        {mode === "view" && historyData.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Heading size="md">History</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                {historyData.map((h, idx) => (
                  <Flex key={idx} gap={3} align="flex-start">
                    <Box minW="8px" h="8px" mt="6px" borderRadius="full" bg={BIZGEN_COLOR} />
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" textTransform="capitalize">{h.action}</Text>
                      {h.note && <Text fontSize="xs" color="gray.500">{h.note}</Text>}
                      <Text fontSize="xs" color="gray.400">{h.created_by} · {new Date(h.created_at).toLocaleString()}</Text>
                    </Box>
                  </Flex>
                ))}
              </Stack>
            </Card.Body>
          </Card.Root>
        )}
      </Stack>

      <Flex justify="flex-end" gap={3} mt={6}>
        <ActionButtons />
      </Flex>
    </SidebarWithHeader>
  );
}
