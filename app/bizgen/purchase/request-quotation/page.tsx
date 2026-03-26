"use client";

import Loading from "@/components/loading";
import CustomerLookup from "@/components/lookup/CustomerLookup";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { AlertMessage } from "@/components/ui/alert";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { GetCustomerData } from "@/lib/master/customer";
import { getAllPort, GetPortData } from "@/lib/master/port";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import { generatePurchaseQuotationNumber } from "@/lib/purchase/quotation";
import {
  Box, Button, Card, createListCollection, Field, Flex,
  Heading, IconButton, Input, Portal, Select, SimpleGrid, Text, Textarea,
} from "@chakra-ui/react";
import { Suspense, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

type ItemRow = {
  id: string;
  description: string;
  hsCode: string;
  qty: number;
  uomId: string;
  unitPrice: number;
  unitPriceInput: string;
  currencyId: string;
};

const SERVICE_TYPES = ["import", "export", "domestic"] as const;
type ServiceType = (typeof SERVICE_TYPES)[number];

export default function CreateRequestQuotationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RequestQuotationContent />
    </Suspense>
  );
}

function RequestQuotationContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState("");
  const [messagePopup, setMessagePopup] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [shipViaOptions, setShipViaOptions] = useState<GetShipViaData[]>([]);
  const [portOptions, setPortOptions] = useState<GetPortData[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
  const [uomOptions, setUomOptions] = useState<UOMData[]>([]);

  const shipViaCollection = createListCollection({
    items: shipViaOptions.map((s) => ({ label: s.ship_via_name, value: s.ship_via_id })),
  });
  const portCollection = createListCollection({
    items: portOptions.map((p) => ({ label: `${p.port_name} - ${p.origin_name}`, value: p.port_id })),
  });
  const currencyCollection = createListCollection({
    items: currencyOptions.map((c) => ({ label: `${c.currency_name} (${c.currency_symbol})`, value: c.currency_id })),
  });
  const uomCollection = createListCollection({
    items: uomOptions.map((u) => ({ label: u.uom_name, value: u.uom_id })),
  });
  const serviceTypeCollection = createListCollection({
    items: SERVICE_TYPES.map((s) => ({
      label: t.purchase_request_quotation[`service_${s}` as "service_import" | "service_export" | "service_domestic"],
      value: s,
    })),
  });

  const [quotationNo, setQuotationNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [shipmentTypeId, setShipmentTypeId] = useState<string>();
  const [serviceType, setServiceType] = useState<ServiceType | undefined>();
  const [originId, setOriginId] = useState<string>();
  const [destinationId, setDestinationId] = useState<string>();
  const [notes, setNotes] = useState("");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), description: "", hsCode: "", qty: 1, uomId: "", unitPrice: 0, unitPriceInput: "", currencyId: "" },
  ]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const valid = await checkAuthOrRedirect();
        if (!valid) return;
        const info = getAuthInfo();
        setAuth(info);
        setLang(info?.language === "id" ? "id" : "en");

        const [shipViaRes, portRes, currencyRes, uomRes, numberRes] = await Promise.all([
          getAllShipVia(1, 1000),
          getAllPort(1, 1000),
          getAllCurrency(1, 1000),
          getAllUOM(1, 1000),
          generatePurchaseQuotationNumber(),
        ]);
        setShipViaOptions(shipViaRes?.data ?? []);
        setPortOptions(portRes?.data ?? []);
        setCurrencyOptions(currencyRes?.data ?? []);
        setUomOptions(uomRes?.data ?? []);
        setQuotationNo(numberRes.number);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", hsCode: "", qty: 1, uomId: "", unitPrice: 0, unitPriceInput: "", currencyId: "" },
    ]);

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

  const updateItem = (id: string, key: string, value: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  const updateUnitPrice = (id: string, raw: string) => {
    const numeric = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, unitPrice: numeric, unitPriceInput: raw } : i));
  };

  const blurUnitPrice = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, unitPriceInput: i.unitPrice === 0 ? "" : i.unitPrice.toLocaleString() } : i));

  const focusUnitPrice = (id: string) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, unitPriceInput: i.unitPrice === 0 ? "" : String(i.unitPrice) } : i));

  const handleChooseCustomer = (selectedCustomer: GetCustomerData) => {
    setCustomer(selectedCustomer.customer_name);
    setCustomerId(selectedCustomer.customer_id);
    setCustomerModalOpen(false);
  };

  const handleSubmit = async () => {
    // TODO: integrate API when endpoint is available
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">{t.purchase_request_quotation.title_create}</Heading>
      </Flex>

      <CustomerLookup isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onChoose={handleChooseCustomer} />
      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      {/* Request Details */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">{t.purchase_request_quotation.request_details}</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Field.Root>
              <Field.Label>{t.purchase_request_quotation.quotation_number}</Field.Label>
              <Input
                placeholder={t.purchase_request_quotation.quotation_number_placeholder}
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_request_quotation.customer}</Field.Label>
              <Input
                placeholder={t.purchase_request_quotation.customer_placeholder}
                value={customer}
                readOnly
                cursor="pointer"
                onClick={() => setCustomerModalOpen(true)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_request_quotation.shipment_type}</Field.Label>
              <Select.Root
                collection={shipViaCollection}
                value={shipmentTypeId ? [shipmentTypeId] : []}
                onValueChange={(d) => setShipmentTypeId(d.value[0])}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_request_quotation.shipment_type_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {shipViaCollection.items.map((s) => (
                        <Select.Item item={s} key={s.value}>{s.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={4}>
            <Field.Root>
              <Field.Label>{t.purchase_request_quotation.service_type}</Field.Label>
              <Select.Root
                collection={serviceTypeCollection}
                value={serviceType ? [serviceType] : []}
                onValueChange={(d) => setServiceType(d.value[0] as ServiceType)}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_request_quotation.service_type_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {serviceTypeCollection.items.map((s) => (
                        <Select.Item item={s} key={s.value}>{s.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_request_quotation.origin}</Field.Label>
              <Select.Root
                collection={portCollection}
                value={originId ? [originId] : []}
                onValueChange={(d) => setOriginId(d.value[0])}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_request_quotation.origin_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {portCollection.items.map((p) => (
                        <Select.Item item={p} key={p.value}>{p.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.purchase_request_quotation.destination}</Field.Label>
              <Select.Root
                collection={portCollection}
                value={destinationId ? [destinationId] : []}
                onValueChange={(d) => setDestinationId(d.value[0])}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.purchase_request_quotation.destination_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {portCollection.items.map((p) => (
                        <Select.Item item={p} key={p.value}>{p.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={4}>
            <Field.Label>{t.purchase_request_quotation.notes}</Field.Label>
            <Textarea
              placeholder={t.purchase_request_quotation.notes_placeholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </Field.Root>
        </Card.Body>
      </Card.Root>

      {/* Line Items */}
      <Card.Root mb={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.purchase_request_quotation.line_items}</Heading>
            <Button size="sm" bg="#E77A1F" color="white" onClick={addItem}>
              {t.purchase_request_quotation.add_item}
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <Box overflowX="auto">
            {/* Column headers */}
            <Flex minW="1080px" gap={3} mb={2} px={1}>
              <Box w="200px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.description}</Text></Box>
              <Box w="120px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.hs_code}</Text></Box>
              <Box w="80px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.quantity}</Text></Box>
              <Box w="150px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.uom}</Text></Box>
              <Box w="150px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.unit_price}</Text></Box>
              <Box w="170px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.currency}</Text></Box>
              <Box w="140px" flexShrink={0}><Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">{t.purchase_request_quotation.total_price}</Text></Box>
              <Box w="36px" flexShrink={0} />
            </Flex>

            {/* Item rows */}
            {items.map((item) => {
              const totalPrice = item.qty * item.unitPrice;
              const currency = currencyOptions.find((c) => c.currency_id === item.currencyId);
              return (
                <Flex key={item.id} minW="1080px" gap={3} mb={3} align="center" px={1}>
                  <Box w="200px" flexShrink={0}>
                    <Input
                      size="sm"
                      placeholder={t.purchase_request_quotation.description_placeholder}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    />
                  </Box>
                  <Box w="120px" flexShrink={0}>
                    <Input
                      size="sm"
                      placeholder={t.purchase_request_quotation.hs_code_placeholder}
                      value={item.hsCode}
                      onChange={(e) => updateItem(item.id, "hsCode", e.target.value)}
                    />
                  </Box>
                  <Box w="80px" flexShrink={0}>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="0"
                      value={item.qty === 0 ? "" : item.qty}
                      onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                    />
                  </Box>
                  <Box w="150px" flexShrink={0}>
                    <Select.Root
                      collection={uomCollection}
                      size="sm"
                      value={item.uomId ? [item.uomId] : []}
                      onValueChange={(d) => updateItem(item.id, "uomId", d.value[0] ?? "")}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.purchase_request_quotation.uom_placeholder} />
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
                  <Box w="150px" flexShrink={0}>
                    <Input
                      size="sm"
                      placeholder="0"
                      value={item.unitPriceInput}
                      onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                      onBlur={() => blurUnitPrice(item.id)}
                      onFocus={() => focusUnitPrice(item.id)}
                    />
                  </Box>
                  <Box w="170px" flexShrink={0}>
                    <Select.Root
                      collection={currencyCollection}
                      size="sm"
                      value={item.currencyId ? [item.currencyId] : []}
                      onValueChange={(d) => updateItem(item.id, "currencyId", d.value[0] ?? "")}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={t.purchase_request_quotation.currency_placeholder} />
                        </Select.Trigger>
                        <Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {currencyCollection.items.map((c) => (
                              <Select.Item item={c} key={c.value}>{c.label}<Select.ItemIndicator /></Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Box>
                  <Box w="140px" flexShrink={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {currency?.currency_symbol ?? ""}{" "}
                      {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </Box>
                  <Box w="36px" flexShrink={0}>
                    <IconButton aria-label="Remove" variant="ghost" color="red" size="sm" onClick={() => removeItem(item.id)}>
                      <FaTrash />
                    </IconButton>
                  </Box>
                </Flex>
              );
            })}
          </Box>
        </Card.Body>
      </Card.Root>

      {/* Actions */}
      <Flex justify="flex-end" mt={4} gap={3}>
        <Button variant="outline">{t.purchase_request_quotation.cancel}</Button>
        <Button variant="outline" onClick={handleSubmit}>{t.purchase_request_quotation.save_draft}</Button>
        <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSubmit}>{t.purchase_request_quotation.submit}</Button>
      </Flex>
    </SidebarWithHeader>
  );
}
