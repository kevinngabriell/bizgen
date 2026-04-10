'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Box, Button, Card, Combobox, createListCollection, Field, Flex, Heading, Input, Portal, Select, Separator, SimpleGrid, Text, Textarea, useFilter, useListCollection } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { SALES_APPROVAL_ROLES, checkAuthOrRedirect, SALES_CREATE_ROLES, DecodedAuthToken, getAuthInfo } from '@/lib/auth/auth';
import Loading from '@/components/loading';
import { getLang } from '@/lib/i18n';
import { getAllShipVia, GetShipViaData } from '@/lib/master/ship-via';
import { getAllPort, GetPortData } from '@/lib/master/port';
import { getAllTerm, GetTermData } from '@/lib/master/term';
import { GetCustomerData } from '@/lib/master/customer';
import CustomerLookup from '@/components/lookup/CustomerLookup';
import { createSalesOrder, generateSalesNumber, getDetailSalesOrder, updateSalesOrder, processSalesOrderAction, GetDetailSalesOrderHistory } from '@/lib/sales/sales-order';
import { getDeliveryOrderBySalesOrderId } from '@/lib/sales/delivery-order';
import { AlertMessage } from '@/components/ui/alert';
import { FaTrash } from 'react-icons/fa';
import { getAllTax, GetTaxData } from '@/lib/master/tax';
import { getAllUOM, UOMData } from '@/lib/master/uom';
import { getAllItem, GetItemData } from '@/lib/master/item';
import RejectDialog from '@/components/dialog/RejectDialog';

type SalesOrderMode = "create" | "view" | "edit";

export default function CreateSalesOrderPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SalesOrderContent />
    </Suspense>
  );
}

function SalesOrderContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const canApprove = SALES_APPROVAL_ROLES.has(auth?.app_role_id ?? "");
  const canCreate = SALES_CREATE_ROLES.has(auth?.app_role_id ?? "");

  const searchParams = useSearchParams();
  const salesOrderID = searchParams.get("sales_order_id");

  const [salesOrderStatus, setSalesOrderStatus] = useState<string>();
  const [salesOrderDetailId, setSalesOrderDetailId] = useState<string>("");
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [deliveryOrderExists, setDeliveryOrderExists] = useState(false);

  const [mode, setMode] = useState<SalesOrderMode>("create");
  // Only lock when status is explicitly submitted or confirmed
  const isReadOnly = mode === "view" && (salesOrderStatus === "submitted" || salesOrderStatus === "confirmed");

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<GetCustomerData | null>(null);

  const [salesOrderNumber, setSalesOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [jobTypeSelected, setJobTypeSelected] = useState<string>();
  const [etd, setEtd] = useState("");
  const [eta, setEta] = useState("");
  const [remarks, setRemarks] = useState("");

  const [historyData, setHistoryData] = useState<GetDetailSalesOrderHistory[]>([]);

  const [shipmentTypeSelected, setShipmentTypeSelected] = useState<string>();
  const [shipmentTypeOptions, setShipmentTypeOptions] = useState<GetShipViaData[]>([]);

  const shipmentTypeCollection = createListCollection({
    items: shipmentTypeOptions.map((s) => ({ label: s.ship_via_name, value: s.ship_via_id })),
  });

  const [taxSelected, setTaxSelected] = useState<string>();
  const [taxOptions, setTaxOptions] = useState<GetTaxData[]>([]);

  const taxCollection = createListCollection({
    items: taxOptions.map((tax) => ({ label: tax.tax_name, value: tax.tax_id })),
  });

  const [originSelected, setOriginSelected] = useState<string>();
  const [destinationSelected, setDestinationSelected] = useState<string>();
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);

  const portCollection = createListCollection({
    items: portOptions.map((port) => ({
      label: `${port.port_name} -  ${port.origin_name}`,
      value: port.port_id,
    })),
  });

  const [termSelected, setTermSelected] = useState<string>();
  const [termOptions, setTermOptions] = useState<GetTermData[]>([]);

  const termCollection = createListCollection({
    items: termOptions.map((term) => ({ label: term.term_name, value: term.term_id })),
  });

  const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);

  const uomCollection = createListCollection({
    items: uomOptions.map((uom) => ({ label: uom.uom_name, value: uom.uom_id })),
  });

  const [itemCollections, setItemCollections] = useState<GetItemData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection: itemCollection, set: setItemCollection } = useListCollection<GetItemData>({
    initialItems: [],
    itemToString: (item) => `${item.item_code} - ${item.item_name}`,
    itemToValue: (item) => item.item_id,
  });

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const showSuccess = (msg: string) => {
    setShowAlert(true);
    setIsSuccess(true);
    setTitlePopup(t.master.success);
    setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  const showError = (msg: string) => {
    setShowAlert(true);
    setIsSuccess(false);
    setTitlePopup(t.master.error);
    setMessagePopup(msg);
    setTimeout(() => setShowAlert(false), 6000);
  };

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);

        await init();

        const [shipViaRes, portRes, termRes, taxRes, uomRes, itemRes] = await Promise.all([
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllTerm(1, 1000),
          getAllTax(1, 1000),
          getAllUOM(1, 1000),
          getAllItem(1, 10000),
        ]);

        const shipViaData = shipViaRes?.data ?? [];
        const portData = portRes?.data ?? [];
        const termData = termRes?.data ?? [];
        const taxData = taxRes?.data ?? [];
        const itemData = itemRes?.data ?? [];

        setShipmentTypeOptions(shipViaData);
        setPortOptions(portData);
        setTermOptions(termData);
        setTaxOptions(taxData);
        setUOMOptions(uomRes?.data ?? []);
        setItemCollection(itemData);
        setItemCollections(itemData);

        if (salesOrderID) {
          setMode("view");
          const res = await getDetailSalesOrder(salesOrderID);

          setSalesOrderDetailId(res.header.sales_order_id);
          setSalesOrderNumber(res.header.sales_order_no);
          setOrderDate(res.header.order_date);
          setSalesOrderStatus(res.header.status);
          setLastUpdatedBy(res.header.updated_by ?? res.header.created_by);
          setLastUpdatedAt(res.header.updated_at ?? res.header.created_at);
          setEta(res.header.eta);
          setEtd(res.header.etd);
          setSalesPerson(res.header.sales_person ?? "");
          setRemarks(res.header.remarks ?? "");

          // Check if delivery order exists
          const deliveryOrder = await getDeliveryOrderBySalesOrderId(salesOrderID);
          setDeliveryOrderExists(!!deliveryOrder);

          setSelectedCustomer({
            customer_id: "",
            customer_name: res.header.customer_name,
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

          // Match dropdown IDs by name from loaded master data
          const sv = shipViaData.find(s => s.ship_via_name === res.header.ship_via_name);
          if (sv) setShipmentTypeSelected(sv.ship_via_id);

          const op = portData.find(p => p.port_name === res.header.origin_port_name);
          if (op) setOriginSelected(op.port_id);

          const dp = portData.find(p => p.port_name === res.header.destination_port_name);
          if (dp) setDestinationSelected(dp.port_id);

          const term = termData.find(tm => tm.term_name === res.header.term_name);
          if (term) setTermSelected(term.term_id);

          const tax = taxData.find(tx => tx.tax_name === res.header.tax_name);
          if (tax) setTaxSelected(tax.tax_id);

          const jt = jobTypeOptions.items.find(j => j.value === res.header.service_type);
          if (jt) setJobTypeSelected(jt.value);

          setItems(
            res.items.map((item, idx) => ({
              id: Date.now() + idx,
              purchaseOrderNo: "",
              productName: item.item_name,
              quantity: String(item.quantity),
              uom: "",
              unitPrice: String(item.unit_price),
              dpp: String(item.dpp),
              ppn: String(item.ppn),
              total: String(item.total),
              notes: "",
            }))
          );

          setHistoryData(res.history);
        } else {
          const res = await generateSalesNumber();
          setSalesOrderNumber(res.number);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [salesOrderID]);

  const init = async () => {
    const valid = await checkAuthOrRedirect();
    if (!valid) return;
    const info = getAuthInfo();
    setAuth(info);
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);
  };

  const [items, setItems] = useState([{ id: Date.now(), purchaseOrderNo: "", productName: "", quantity: "", uom: "", unitPrice: "", dpp: "", ppn: "", total: "", notes: "" }]);

  const handleItemChange = (id: number, field: string, value: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = parseFloat(updated.quantity || "0");
        const price = parseFloat(updated.unitPrice || "0");
        const baseDpp = qty * price;
        const selectedTax = taxOptions.find(t => t.tax_id === taxSelected);
        let dpp = baseDpp;
        let ppn = 0;
        if (selectedTax) {
          const rate = parseFloat(selectedTax.tax_rate || "0");
          dpp = baseDpp;
          ppn = baseDpp * (rate / 100);
        }
        const total = dpp + ppn;
        return { ...updated, dpp: dpp.toFixed(2), ppn: ppn.toFixed(2), total: total.toFixed(2) };
      })
    );
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), purchaseOrderNo: "", productName: "", quantity: "", uom: "", unitPrice: "", dpp: "", ppn: "", total: "", notes: "" },
    ]);
  };

  const removeItemRow = (id: number) => {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  };

  const formatNumber = (value: string) => {
    if (!value) return '';
    const cleaned = value.replace(/,/g, '');
    if (cleaned === '' || cleaned === '.') return cleaned;
    const parts = cleaned.split('.');
    const formattedInt = Number(parts[0] || 0).toLocaleString('en-US');
    return parts[1] !== undefined ? `${formattedInt}.${parts[1]}` : formattedInt;
  };

  const parseNumber = (value: string) => {
    let cleaned = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    const [intPart, decPart] = cleaned.split('.');
    if (decPart !== undefined) cleaned = `${intPart}.${decPart.slice(0, 2)}`;
    return cleaned;
  };

  const totals = items.reduce(
    (acc, item) => {
      acc.unitPrice += parseFloat(item.unitPrice || "0");
      acc.dpp += parseFloat(item.dpp || "0");
      acc.ppn += parseFloat(item.ppn || "0");
      acc.total += parseFloat(item.total || "0");
      return acc;
    },
    { unitPrice: 0, dpp: 0, ppn: 0, total: 0 }
  );

  const handleChooseCustomer = (customer: GetCustomerData) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!salesOrderNumber) throw new Error(t.sales_order.error_1);
      if (!selectedCustomer?.customer_id) throw new Error(t.sales_order.error_2);
      if (!orderDate) throw new Error(t.sales_order.error_3);
      if (!etd) throw new Error(t.sales_order.error_5);
      if (!eta) throw new Error(t.sales_order.error_6);
      if (items.length === 0) throw new Error(t.sales_order.error_7);

      await createSalesOrder({
        sales_order_no: salesOrderNumber,
        customer_id: selectedCustomer.customer_id,
        inquiry_ref: "",
        order_date: orderDate,
        sales_person: salesPerson || "",
        service_type: jobTypeSelected || "",
        ship_via_id: shipmentTypeSelected || "",
        origin_port: originSelected || "",
        destination_port: destinationSelected || "",
        term_id: termSelected || "",
        remarks: remarks || "",
        tax_id: taxSelected || "",
        eta: eta || "",
        etd: etd || "",
        items: items.map((row) => ({
          item_id: row.productName,
          quantity: row.quantity,
          unit_price: row.unitPrice,
          dpp: row.dpp,
          ppn: row.ppn,
          total: String(row.total ?? 0),
          notes: row.notes || "",
        })),
      });

      showSuccess(t.sales_order.success_create);

      setSalesOrderNumber("");
      setSelectedCustomer(null);
      setOrderDate("");
      setSalesPerson("");
      setJobTypeSelected(undefined);
      setShipmentTypeSelected(undefined);
      setOriginSelected(undefined);
      setDestinationSelected(undefined);
      setTermSelected(undefined);
      setTaxSelected(undefined);
      setEtd("");
      setEta("");
      setRemarks("");
      setItems([{ id: Date.now(), purchaseOrderNo: "", productName: "", quantity: "", uom: "", unitPrice: "", dpp: "", ppn: "", total: "", notes: "" }]);
    } catch (err: any) {
      showError(err.message || t.sales_costing_expense.error_msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!salesOrderDetailId) throw new Error("Sales Order ID not found");
      setLoading(true);

      await updateSalesOrder({
        so_id: salesOrderDetailId,
        order_date: orderDate,
        sales_person: salesPerson,
        eta: eta,
        etd: etd,
        remarks: remarks,
      });

      showSuccess(t.sales_order.success_update);
    } catch (err: any) {
      showError(err.message || "Failed to update sales order.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSalesOrder = async () => {
    try {
      if (!salesOrderDetailId) throw new Error("Sales Order ID not found");
      setLoading(true);

      await processSalesOrderAction({ so_id: salesOrderDetailId, action: "submit" });

      setSalesOrderStatus("submitted");
      showSuccess("Sales order submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit sales order.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      if (!salesOrderDetailId) throw new Error("Sales Order ID not found");
      setLoading(true);

      await processSalesOrderAction({ so_id: salesOrderDetailId, action: "approve" });

      setSalesOrderStatus("confirmed");
      showSuccess("Sales order approved successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to approve sales order.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      if (!salesOrderDetailId) throw new Error("Sales Order ID not found");
      setRejectLoading(true);

      await processSalesOrderAction({ so_id: salesOrderDetailId, action: "reject", notes: reason });

      setIsRejectDialogOpen(false);
      setSalesOrderStatus("cancelled");
      showSuccess("Sales order rejected successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to reject sales order.");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCreateDeliveryOrder = () => {
    if (!salesOrderDetailId) {
      showError("Sales Order ID not found");
      return;
    }
    router.push(`/bizgen/sales/delivery-order?sales_order_id=${salesOrderDetailId}`);
  };

  if (loading) return <Loading />;

  return (
    <>
      <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
        <Heading size="lg">
          {mode === "create" ? t.sales_order.title_create : t.sales_order.title_view}
        </Heading>

        <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />

        {mode === "view" && (
          <Card.Root mt={3}>
            <Card.Body>
              <Flex justifyContent="space-between">
                <Badge
                  variant="solid"
                  colorPalette={
                    salesOrderStatus === "confirmed" ? "green"
                    : salesOrderStatus === "cancelled" ? "red"
                    : salesOrderStatus === "submitted" ? "blue"
                    : "yellow"
                  }
                >
                  {salesOrderStatus ? salesOrderStatus.charAt(0).toUpperCase() + salesOrderStatus.slice(1) : ""}
                </Badge>
                <Text fontSize="xs" color="gray.600">
                  {t.master.last_update_by} <b>{lastUpdatedBy || "System"}</b> • {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                </Text>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

        <Card.Root mt={4}>
          <Card.Header>
            <Heading>{t.sales_order.order_information}</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5} mb={6}>
              <Field.Root required>
                <Field.Label>{t.sales_order.sales_order_number}<Field.RequiredIndicator /></Field.Label>
                <Input
                  placeholder={t.sales_order.sales_order_number_placeholder}
                  value={salesOrderNumber}
                  readOnly={mode === "view"}
                  onChange={(e) => setSalesOrderNumber(e.target.value)}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_order.order_date} <Field.RequiredIndicator /></Field.Label>
                <Input type="date" value={orderDate} readOnly={isReadOnly} onChange={(e) => setOrderDate(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.tax}</Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  collection={taxCollection}
                  value={taxSelected ? [taxSelected] : []}
                  onValueChange={(details) => {
                    const selected = details.value[0];
                    setTaxSelected(selected);
                    setItems(prev =>
                      prev.map(item => {
                        const qty = parseFloat(item.quantity || "0");
                        const price = parseFloat(item.unitPrice || "0");
                        const baseDpp = qty * price;
                        const selectedTax = taxOptions.find(t => t.tax_id === selected);
                        let dpp = baseDpp;
                        let ppn = 0;
                        if (selectedTax) {
                          const rate = parseFloat(selectedTax.tax_rate || "0");
                          dpp = baseDpp;
                          ppn = baseDpp * (rate / 100);
                        }
                        const total = dpp + ppn;
                        return { ...item, dpp: dpp.toFixed(2), ppn: ppn.toFixed(2), total: total.toFixed(2) };
                      })
                    );
                  }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.tax_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {taxCollection.items.map((tax) => (
                          <Select.Item item={tax} key={tax.value}>{tax.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_order.customer}<Field.RequiredIndicator /></Field.Label>
                <Input placeholder={t.sales_order.customer_placeholder} value={selectedCustomer?.customer_name ?? ""} readOnly cursor={mode === "view" ? "default" : "pointer"} onClick={() => mode !== "view" && setCustomerModalOpen(true)}/>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.customer_information}</Field.Label>
                <Box fontSize="xs" color="gray.500" lineHeight="short">
                  <Text>{selectedCustomer?.customer_address ?? "-"}</Text>
                  <Text>{selectedCustomer?.customer_phone ?? "-"}</Text>
                  <Text>TOP: {selectedCustomer?.customer_top ?? "-"}</Text>
                </Box>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.service_type}</Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  collection={jobTypeOptions}
                  value={jobTypeSelected ? [jobTypeSelected] : []}
                  onValueChange={(details) => setJobTypeSelected(details.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.service_type_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {jobTypeOptions.items.map((jobType) => (
                          <Select.Item item={jobType} key={jobType.value}>
                            {jobType.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.shipment_mode}</Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  collection={shipmentTypeCollection}
                  value={shipmentTypeSelected ? [shipmentTypeSelected] : []}
                  onValueChange={(details) => setShipmentTypeSelected(details.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.shipment_mode_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {shipmentTypeCollection.items.map((shipment) => (
                          <Select.Item item={shipment} key={shipment.value}>{shipment.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.sales_person}</Field.Label>
                <Input
                  placeholder={t.sales_order.sales_person_placeholder}
                  value={salesPerson}
                  readOnly={isReadOnly}
                  onChange={(e) => setSalesPerson(e.target.value)}
                />
              </Field.Root>
            </SimpleGrid>

            <Separator />

            <Heading size="md" mt={5} mb={3}>{t.sales_order.origin_destination}</Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} mb={4}>
              <Field.Root>
                <Field.Label>{t.sales_order.origin_port}</Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  collection={portCollection}
                  value={originSelected ? [originSelected] : []}
                  onValueChange={(details) => setOriginSelected(details.value[0])}
                  width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.origin_port_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {portCollection.items.map((port) => (
                          <Select.Item item={port} key={port.value}>{port.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.destination_port}</Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  collection={portCollection}
                  value={destinationSelected ? [destinationSelected] : []}
                  onValueChange={(details) => setDestinationSelected(details.value[0])}
                  width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.destination_port_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {portCollection.items.map((port) => (
                          <Select.Item item={port} key={port.value}>{port.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.sales_order.incoterm}</Field.Label>
                <Select.Root
                  disabled={mode === "view"}
                  collection={termCollection}
                  value={termSelected ? [termSelected] : []}
                  onValueChange={(details) => setTermSelected(details.value[0])}
                  width="100%"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder={t.sales_order.incoterm_placeholder} />
                    </Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {termCollection.items.map((term) => (
                          <Select.Item item={term} key={term.value}>{term.label}<Select.ItemIndicator /></Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
              <Field.Root required>
                <Field.Label>{t.sales_order.etd}<Field.RequiredIndicator /> </Field.Label>
                <Input type="date" value={etd} readOnly={isReadOnly} onChange={(e) => setEtd(e.target.value)} />
              </Field.Root>
              <Field.Root required>
                <Field.Label>{t.sales_order.eta}<Field.RequiredIndicator /></Field.Label>
                <Input type="date" value={eta} readOnly={isReadOnly} onChange={(e) => setEta(e.target.value)} />
              </Field.Root>
            </SimpleGrid>

            <Separator />

            <Heading size="md" mt={6} mb={4}>{t.sales_order.cargo_details}</Heading>

            <Box overflowX="auto">
              <Box>
                {items.map((item) => (
                  <SimpleGrid key={item.id} templateColumns="200px 220px 120px 120px 160px 160px 160px 180px 120px" gap={4} mb={4}>
                    <Field.Root>
                      <Field.Label>{t.sales_order.product_name}</Field.Label>
                      {mode === "view" ? (
                        <Input value={item.productName} readOnly />
                      ) : (
                        <Combobox.Root
                          key={`item-${item.id}`}
                          collection={itemCollection}
                          value={item.productName ? [item.productName] : []}
                          onValueChange={(details) => {
                            const selected = details.value?.[0];
                            handleItemChange(item.id, 'productName', selected ?? '');
                          }}
                          onInputValueChange={(e) => {
                            const input = e.inputValue ?? "";
                            if (!input || input.trim() === "") {
                              setItemCollection(itemCollections);
                              return;
                            }
                            const filtered = itemCollections.filter((it) =>
                              contains(`${it.item_code} - ${it.item_name}`, input)
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
                                {itemCollection.items.map((it) => (
                                  <Combobox.Item item={it} key={it.item_id}>
                                    {it.item_code} - {it.item_name}
                                    <Combobox.ItemIndicator />
                                  </Combobox.Item>
                                ))}
                              </Combobox.Content>
                            </Combobox.Positioner>
                          </Portal>
                        </Combobox.Root>
                      )}
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.quantity_packaging}</Field.Label>
                      <Input
                        type="number"
                        placeholder={t.sales_order.quantity_packaging_placeholder}
                        value={item.quantity}
                        readOnly={mode === "view"}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.uom}</Field.Label>
                      <Select.Root
                        disabled={mode === "view"}
                        collection={uomCollection}
                        value={item.uom && uomCollection.items.some(i => i.value === item.uom) ? [item.uom] : []}
                        onValueChange={(details) => handleItemChange(item.id, "uom", details.value?.[0] ?? "")}
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
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.unit_price}</Field.Label>
                      <Input placeholder={t.sales_order.unit_price_placeholder} value={formatNumber(item.unitPrice)} readOnly={mode === "view"} onChange={(e) => handleItemChange(item.id, "unitPrice", parseNumber(e.target.value))}/>
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.dpp}</Field.Label>
                      <Input placeholder={t.sales_order.dpp_placeholder} value={formatNumber(item.dpp)} readOnly />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.tax}</Field.Label>
                      <Input placeholder={t.sales_order.tax_placeholder} value={formatNumber(item.ppn)} readOnly />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.total}</Field.Label>
                      <Input placeholder={t.sales_order.total_placeholder} value={formatNumber(item.total)} readOnly />
                    </Field.Root>
                    <Field.Root>
                      <Field.Label>{t.sales_order.notes}</Field.Label>
                      <Input
                        placeholder={t.sales_order.notes_placeholder}
                        value={item.notes}
                        readOnly={mode === "view"}
                        onChange={(e) => handleItemChange(item.id, "notes", e.target.value)}
                      />
                    </Field.Root>
                    {mode !== "view" && (
                      <Flex align="flex-end">
                        <Button color="red" borderColor="red" variant="outline" onClick={() => removeItemRow(item.id)}>
                          <FaTrash color='red' />
                          {t.delete_popup.delete}
                        </Button>
                      </Flex>
                    )}
                  </SimpleGrid>
                ))}

                {/* Total row */}
                <Box mt={2} pt={2} borderTop="2px solid" borderColor="gray.300">
                  <SimpleGrid minW="1000px" templateColumns="200px 220px 120px 120px 160px 160px 160px 180px 120px" gap={4} mb={4}>
                    <Text fontWeight="bold">Total</Text>
                    <Box /><Box />
                    <Input value={formatNumber(String(totals.unitPrice))} readOnly textAlign="right" fontWeight="bold" />
                    <Input value={formatNumber(String(totals.dpp))} readOnly textAlign="right" fontWeight="bold" />
                    <Input value={formatNumber(String(totals.ppn))} readOnly textAlign="right" fontWeight="bold" />
                    <Input value={formatNumber(String(totals.total))} readOnly textAlign="right" fontWeight="bold" />
                  </SimpleGrid>
                </Box>
              </Box>
            </Box>

            {mode !== "view" && (
              <Button mt={2} bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer" onClick={addItemRow}>
                {t.sales_order.add_item}
              </Button>
            )}

            <Field.Root mt={4}>
              <Field.Label>{t.sales_order.remarks}</Field.Label>
              <Textarea
                rows={4}
                placeholder={t.sales_order.remarks_placeholder}
                value={remarks}
                readOnly={isReadOnly}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Field.Root>

            {/* Create mode */}
            {mode === "create" && canCreate && (
              <Flex justify="flex-end" gap={3} mt={5}>
                <Button variant="outline" bg="transparent" borderColor="#E77A1F" color="#E77A1F" cursor="pointer">{t.delete_popup.cancel}</Button>
                <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSubmit}>{t.sales_order.save_sales_order}</Button>
              </Flex>
            )}

            {/* Draft or Cancelled: Save + Submit */}
            {(salesOrderStatus === "draft" || salesOrderStatus === "cancelled") && (
              <Flex justify="flex-end" gap={3} mt={5}>
                <Button variant="outline" onClick={handleUpdate}>{t.master.save}</Button>
                <Button bg="#E77A1F" color="white" onClick={handleSubmitSalesOrder}>{t.master.submit}</Button>
              </Flex>
            )}

            {/* Submitted: Export PDF + Reject + Approve */}
            {salesOrderStatus === "submitted" && (
              <Flex gap={3} justifyContent="space-between" mt={5}>
                <Button variant="outline">{t.master.export_pdf}</Button>
                <Flex gap={6}>
                  {canApprove && <Button color="red" borderColor="red" variant="outline" onClick={() => setIsRejectDialogOpen(true)}>{t.master.reject}</Button>}
                  {canApprove && <Button backgroundColor="green" onClick={handleApprove}>{t.master.approve}</Button>}
                </Flex>
              </Flex>
            )}

            {/* Confirmed (Approved): Create Delivery Order if not exists */}
            {salesOrderStatus === "confirmed" && (
              <Flex gap={3} justifyContent="flex-end" mt={5}>
                {!deliveryOrderExists && (
                  <Button bg="#E77A1F" color="white" onClick={handleCreateDeliveryOrder}>{t.sales_order.create_delivery_order || "Create Delivery Order"}</Button>
                )}
                {deliveryOrderExists && (
                  <Text color="gray.600" fontSize="sm">{t.sales_order.delivery_order_created || "Delivery Order has been created"}</Text>
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
    </>
  );
}

const jobTypeOptions = createListCollection({
  items: [
    { label: "Export", value: "export" },
    { label: "Import", value: "import" },
    { label: "Domestic", value: "domestic" },
  ],
});
