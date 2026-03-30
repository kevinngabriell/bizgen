"use client";

import Loading from "@/components/loading";
import SupplierLookup from "@/components/lookup/SupplierLookup";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { getAllItem, GetItemData } from "@/lib/master/item";
import { GetSupplierData } from "@/lib/master/supplier";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import {
  createPurchaseRequisition,
  CreatePurchaseRequisitionItem,
  generatePurchaseRequisitionNumber,
} from "@/lib/purchase/requisition";
import {
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
import { FaTrash } from "react-icons/fa";

const BIZGEN_COLOR = "#E77A1F";

type RequisitionItem = CreatePurchaseRequisitionItem & {
  id: string;
  displayName: string; // combobox display only — not sent to API
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

export default function PurchaseRequisitionCreatePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PurchaseRequisitionContent />
    </Suspense>
  );
}

function PurchaseRequisitionContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);
  const tr = t.purchase_requisition;

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState("");
  const [messagePopup, setMessagePopup] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [prioritySelected, setPrioritySelected] = useState<string>();
  const [categorySelected, setCategorySelected] = useState<string>();
  const [currencySelected, setCurrencySelected] = useState<string>();

  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);

  // Item master for combobox
  const [itemMasterAll, setItemMasterAll] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" });
  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  });

  // Supplier lookup
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<GetSupplierData | null>(null);

  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({
      label: `${c.currency_code} — ${c.currency_name}`,
      value: c.currency_id,
    })),
  });

  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });

  const selectedCurrencyCode =
    currencyOptions.find((c) => c.currency_id === currencySelected)?.currency_code ?? "";

  const [form, setForm] = useState({
    pr_number: "",
    pr_date: "",
    requester: "",
    department: "",
    needed_by: "",
    notes: "",
  });

  const [items, setItems] = useState<RequisitionItem[]>([newItem()]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === "id" ? "id" : "en");

        const [prNumberRes, currencyRes, uomRes, itemRes] = await Promise.all([
          generatePurchaseRequisitionNumber(),
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          getAllItem(1, 10000),
        ]);

        setForm((prev) => ({ ...prev, pr_number: prNumberRes.number }));
        setCurrencyOptions(currencyRes?.data ?? []);
        setUomOptions(uomRes?.data ?? []);

        const itemData = itemRes?.data ?? [];
        setItemMasterAll(itemData);
        setItemCollection(itemData);
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  function newItem(): RequisitionItem {
    return { id: crypto.randomUUID(), displayName: "", item_id: "", quantity: "", uom_id: "", estimated_price: "", remarks: "" };
  }

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

  const resetForm = async () => {
    const res = await generatePurchaseRequisitionNumber();
    setForm({ pr_number: res.number, pr_date: "", requester: "", department: "", needed_by: "", notes: "" });
    setPrioritySelected(undefined);
    setCategorySelected(undefined);
    setCurrencySelected(undefined);
    setSelectedSupplier(null);
    setItems([newItem()]);
  };

  const handleSubmit = async (mode: "draft" | "submitted") => {
    try {
      if (!form.pr_number) throw new Error(tr.error_pr_number);
      if (!form.pr_date) throw new Error(tr.error_pr_date);
      if (!form.requester) throw new Error(tr.error_requester);
      if (!form.department) throw new Error(tr.error_department);
      if (!currencySelected) throw new Error(tr.error_currency);
      if (!items.some((it) => it.item_id.trim())) throw new Error(tr.error_items);
      const invalidItem = items.find(
        (it) =>
          !it.item_id.trim() ||
          !it.uom_id.trim() ||
          it.quantity === '' ||
          parseFloat(it.quantity) < 0 ||
          it.estimated_price === '' ||
          parseFloat(it.estimated_price) < 0
      );
      if (invalidItem) throw new Error(tr.error_item_fields);

      setLoading(true);

      await createPurchaseRequisition({
        pr_number: form.pr_number,
        pr_date: form.pr_date,
        requester_name: form.requester,
        department: form.department,
        priority: (prioritySelected ?? "normal") as "normal" | "urgent" | "critical",
        category: (categorySelected ?? "other") as "operational_supplies" | "office_supplies" | "it_equipment" | "logistics_equipment" | "services" | "other",
        deadline_date: form.needed_by,
        supplier_id: selectedSupplier?.supplier_id ?? "",
        currency_id: currencySelected ?? "",
        notes: form.notes,
        status: mode,
        items: items.map(({ id: _id, displayName: _dn, ...rest }) => rest),
      });

      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(mode === "draft" ? tr.success_draft : tr.success_submit);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);

      await resetForm();
    } catch (err: any) {
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.master.error_msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir="column">
          <Heading size="lg">{tr.title}</Heading>
          <Text color="gray.500" fontSize="sm">{tr.subtitle}</Text>
        </Flex>
        <Flex gap={3}>
          <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={() => handleSubmit("draft")}>
            {tr.save_draft}
          </Button>
          <Button bg={BIZGEN_COLOR} color="white" onClick={() => handleSubmit("submitted")}>
            {tr.submit}
          </Button>
        </Flex>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      <SupplierLookup
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onChoose={handleChooseSupplier}
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
                <Field.Label >{tr.pr_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  name="pr_number"
                  value={form.pr_number}
                  onChange={(e) => setForm({ ...form, pr_number: e.target.value })}
                  placeholder={tr.pr_number_placeholder}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label >{tr.pr_date}<Field.RequiredIndicator /></Field.Label>
                <Input
                  type="date"
                  name="pr_date"
                  value={form.pr_date}
                  onChange={(e) => setForm({ ...form, pr_date: e.target.value })}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label >{tr.requester}<Field.RequiredIndicator /></Field.Label>
                <Input
                  name="requester"
                  value={form.requester}
                  onChange={(e) => setForm({ ...form, requester: e.target.value })}
                  placeholder={tr.requester_placeholder}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label >{tr.department}<Field.RequiredIndicator /></Field.Label>
                <Input
                  name="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder={tr.department_placeholder}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label >{tr.priority}</Field.Label>
                <Select.Root
                  collection={priorityOptions}
                  value={prioritySelected ? [prioritySelected] : []}
                  onValueChange={(d) => setPrioritySelected(d.value[0])}
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
                          <Select.Item item={opt} key={opt.value}>
                            {opt.label}<Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label >{tr.category}</Field.Label>
                <Select.Root
                  collection={categoryOptions}
                  value={categorySelected ? [categorySelected] : []}
                  onValueChange={(d) => setCategorySelected(d.value[0])}
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
                          <Select.Item item={opt} key={opt.value}>
                            {opt.label}<Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label >{tr.needed_by}</Field.Label>
                <Input
                  type="date"
                  name="needed_by"
                  value={form.needed_by}
                  onChange={(e) => setForm({ ...form, needed_by: e.target.value })}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label >{tr.preferred_vendor}</Field.Label>
                <Input
                  value={selectedSupplier?.supplier_name ?? ""}
                  readOnly
                  cursor="pointer"
                  placeholder={tr.preferred_vendor_placeholder}
                  onClick={() => setSupplierModalOpen(true)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label >{tr.currency}<Field.RequiredIndicator /></Field.Label>
                <Select.Root
                  collection={currencyCollection}
                  value={currencySelected ? [currencySelected] : []}
                  onValueChange={(d) => setCurrencySelected(d.value[0])}
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
                          <Select.Item item={opt} key={opt.value}>
                            {opt.label}<Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
            </SimpleGrid>

            <Field.Root mt={4}>
              <Field.Label >{tr.notes}</Field.Label>
              <Textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={tr.notes_placeholder}
              />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Requested Items */}
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">{tr.requested_items}</Heading>
              <Button size="sm" variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={addItem}>
                {tr.add_item}
              </Button>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Box overflowX="auto">
              {/* Column Headers */}
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

              {/* Item Rows */}
              {items.map((item, idx) => (
                <Flex key={item.id} minW="1260px" gap={3} mb={3} align="center" px={1}>
                  {/* Row number */}
                  <Box w="32px" flexShrink={0}>
                    <Text  color="gray.400">{idx + 1}</Text>
                  </Box>

                  {/* Item — Combobox from item master */}
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
                        if (!input.trim()) {
                          setItemCollection(itemMasterAll);
                          return;
                        }
                        setItemCollection(
                          itemMasterAll.filter((i) => contains(`${i.item_code} - ${i.item_name}`, input))
                        );
                      }}
                    >
                      <Combobox.Control>
                        <Combobox.Input
                          placeholder={tr.description_placeholder}
                          value={item.displayName}
                          onFocus={() => setItemCollection(itemMasterAll)}
                        />
                        <Combobox.IndicatorGroup>
                          <Combobox.ClearTrigger onClick={() => { handleItemChange(item.id, "item_id", ""); handleItemChange(item.id, "displayName", ""); }} />
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>No items found</Combobox.Empty>
                            {itemCollection.items.map((i) => (
                              <Combobox.Item item={i} key={i.item_id}>
                                {i.item_code} - {i.item_name}
                                <Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                  </Box>

                  {/* Qty */}
                  <Box w="100px" flexShrink={0}>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                    />
                  </Box>

                  {/* UOM */}
                  <Box w="160px" flexShrink={0}>
                    <Select.Root
                      collection={uomCollection}
                      value={item.uom_id ? [item.uom_id] : []}
                      onValueChange={(d) => handleItemChange(item.id, "uom_id", d.value[0])}
                      width="100%"
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
                              <Select.Item item={u} key={u.value}>
                                {u.label}<Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Box>

                  {/* Est. Price */}
                  <Box w="160px" flexShrink={0}>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.estimated_price}
                      onChange={(e) => handleItemChange(item.id, "estimated_price", e.target.value)}
                    />
                  </Box>

                  {/* Subtotal */}
                  <Box w="160px" flexShrink={0}>
                    <Input value={computeSubtotal(item)} readOnly bg="gray.50" />
                  </Box>

                  {/* Remarks */}
                  <Box w="220px" flexShrink={0}>
                    <Input
                      placeholder={tr.remarks_placeholder}
                      value={item.remarks}
                      onChange={(e) => handleItemChange(item.id, "remarks", e.target.value)}
                    />
                  </Box>

                  {/* Delete */}
                  <Box w="40px" flexShrink={0}>
                    <IconButton
                      aria-label="Remove item"
                      variant="ghost"
                      color="red.500"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <FaTrash />
                    </IconButton>
                  </Box>
                </Flex>
              ))}

              {/* Grand Total */}
              <Separator mt={2} mb={3} />
              <Flex justify="flex-end" minW="1260px" pr={1}>
                <Flex align="center" gap={3}>
                  <Text fontWeight="bold" >
                    {tr.subtotal} Total{selectedCurrencyCode ? ` (${selectedCurrencyCode})` : ""}
                  </Text>
                  <Input
                    value={grandTotal.toLocaleString()}
                    readOnly
                    bg="gray.50"
                    fontWeight="bold"
                    w="160px"
                    textAlign="right"
                  />
                </Flex>
              </Flex>
            </Box>
          </Card.Body>
        </Card.Root>
      </Stack>

      <Flex justify="flex-end" gap={3} mt={6}>
        <Button variant="outline" color={BIZGEN_COLOR} borderColor={BIZGEN_COLOR} onClick={() => handleSubmit("draft")}>
          {tr.save_draft}
        </Button>
        <Button bg={BIZGEN_COLOR} color="white" onClick={() => handleSubmit("submitted")}>
          {tr.submit}
        </Button>
      </Flex>
    </SidebarWithHeader>
  );
}
