"use client";

import {Button, Flex, Field, Heading, Input, NumberInput, SimpleGrid, Textarea, Card, useFilter, useListCollection, createListCollection, Select,} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllProduct, GetProductData } from "@/lib/master/product";
import {
  Combobox,
  Portal
} from "@chakra-ui/react"
import { getAllUOM, UOMData } from "@/lib/master/uom";

export default function CreateStockInPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

   const [productOptions, setProductOptions] = useState<GetProductData[]>([]);

  const { contains } = useFilter({ sensitivity: "base"})

const list = useListCollection<GetProductData>({
  initialItems: productOptions,
  filter: contains,
  itemToString: (item) => item.product_name,
});

const { collection, filter } = list;


  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

    //set uom selection
    const [uomOptions, setUOMOptions] = useState<UOMData[]>([]);
    const [uomSelected, setUOMSelected] = useState<string>();

    const uomCollection = createListCollection({
      items: uomOptions.map((uom) => ({
        label: `${uom.uom_name}`,
        value: uom.uom_id,
      })),
    });

  useEffect(() => {

    const fetchUOM = async () => {
          try {
            const uomRes = await getAllUOM(1, 1000);
            setUOMOptions(uomRes?.data ?? []);
          } catch (error) {
            console.error(error);
            setUOMOptions([]);
          }
        };

    fetchUOM();
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    const productRes = await getAllProduct(1, 1000);
    setProductOptions(productRes?.data ?? []);

    setLoading(false);
  }

  const [form, setForm] = useState({
    lotNo: "",
    productName: "",
    quantity: 0,
    unit: "PCS",
    warehouse: "",
    binLocation: "",
    receivedDate: "",
    expiryDate: "",
    supplier: "",
    referenceNo: "",
    notes: "",
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.lotNo || !form.productName || !form.quantity || !form.warehouse) {
      return;
    }

    try {
      // TODO: connect to API
      console.log("Submitting stock-in payload:", form);

      router.back();
    } catch (e) {

    }
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading>Add New Stock (Stock In)</Heading>

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root>
              <Field.Label>LOT Number</Field.Label>
              <Input placeholder="e.g. LOT-2026-0001" value={form.lotNo} onChange={(e) => handleChange("lotNo", e.target.value)}/>
              <Field.HelperText>Primary identifier for this batch. (You can later switch to UUID/auto-generated if needed)</Field.HelperText>
            </Field.Root>
            <Field.Root >
              <Field.Label>Product Name</Field.Label>
              <Combobox.Root
  collection={collection}
  value={form.productName ? [form.productName] : []}
  onValueChange={(details) => {
    const selected = details.value?.[0];
    handleChange("productName", selected);
  }}
  onInputValueChange={(e) => filter(e.inputValue)}
>
                  <Combobox.Control>
                    <Combobox.Input placeholder="Type to search" />
                    <Combobox.IndicatorGroup>
                      <Combobox.ClearTrigger />
                      <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                  </Combobox.Control>
                  <Portal>
                    <Combobox.Positioner>
                      <Combobox.Content>
                        <Combobox.Empty>No items found</Combobox.Empty>
                        {collection.items.map((item) => (
                          <Combobox.Item item={item} key={item.product_code}>
                            {item.product_name}
                            <Combobox.ItemIndicator />
                          </Combobox.Item>
                        ))}
                      </Combobox.Content>
                    </Combobox.Positioner>
                  </Portal>
              </Combobox.Root>
            </Field.Root>
            <Field.Root w={"100%"}>
              <Field.Label>Quantity</Field.Label>
              <NumberInput.Root w={"100%"}>
                <NumberInput.Control/>
                <NumberInput.Input/>
              </NumberInput.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Unit</Field.Label>
                <Select.Root collection={uomCollection} value={uomSelected ? [uomSelected] : []} onValueChange={(details) => setUOMSelected(details.value[0])} size="sm" width="100%">
                                <Select.HiddenSelect />
                                <Select.Control>
                                  <Select.Trigger>
                                    <Select.ValueText placeholder={t.purchase_invoice.supplier_placeholder} />
                                  </Select.Trigger>
                                  <Select.IndicatorGroup>
                                    <Select.Indicator />
                                  </Select.IndicatorGroup>
                                </Select.Control>
                                <Portal>
                                  <Select.Positioner>
                                    <Select.Content>
                                      {uomCollection.items.map((uom) => (
                                        <Select.Item item={uom} key={uom.value}>
                                          {uom.label}
                                          <Select.ItemIndicator />
                                        </Select.Item>
                                      ))}
                                    </Select.Content>
                                  </Select.Positioner>
                                </Portal>
                              </Select.Root>
            </Field.Root>

            <Field.Root >
              <Field.Label>Warehouse</Field.Label>
              <Input placeholder="e.g. Main Warehouse A" value={form.warehouse} onChange={(e) => handleChange("warehouse", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Bin / Location</Field.Label>
              <Input placeholder="e.g. Rack B-03" value={form.binLocation} onChange={(e) => handleChange("binLocation", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Received Date</Field.Label>
              <Input type="date" value={form.receivedDate} onChange={(e) => handleChange("receivedDate", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Expiry Date (Optional)</Field.Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => handleChange("expiryDate", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Supplier</Field.Label>
              <Input placeholder="Supplier name" value={form.supplier} onChange={(e) => handleChange("supplier", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>Reference No. (PO / Inbound)</Field.Label>
              <Input placeholder="Optional reference link to PO / Shipment" value={form.referenceNo} onChange={(e) => handleChange("referenceNo", e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={4} mb={6}>
            <Field.Label>Notes</Field.Label>
            <Textarea rows={4} placeholder="Additional remarks…" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)}/>
          </Field.Root>

          <Flex gap={4} justify="flex-end">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button colorScheme="teal" onClick={handleSubmit}>Save Stock</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}
