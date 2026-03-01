"use client";

import {Button, Flex, Field, Heading, Input, NumberInput, SimpleGrid, Textarea, Card, useFilter, useListCollection, createListCollection, Select, Combobox, Portal} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllProduct, GetProductData } from "@/lib/master/product";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import { FaTrash } from "react-icons/fa";

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
    productName: "",
    warehouse: "",
    receivedDate: "",
    supplier: "",
    referenceNo: "",
    notes: "",
  });

  const [lots, setLots] = useState([
    {
      id: crypto.randomUUID(),
      lotNo: "",
      quantity: 0,
      expiryDate: "",
      binLocation: "",
    },
  ]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLotChange = (id: string, key: string, value: any) => {
    setLots((prev) =>
      prev.map((lot) =>
        lot.id === id ? { ...lot, [key]: value } : lot
      )
    );
  };

  const handleAddLot = () => {
    setLots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        lotNo: "",
        quantity: 0,
        expiryDate: "",
        binLocation: "",
      },
    ]);
  };

  const handleRemoveLot = (id: string) => {
    if (lots.length === 1) return;
    setLots((prev) => prev.filter((lot) => lot.id !== id));
  };

  const handleSubmit = async () => {
    if (!form.productName || !form.warehouse || lots.length === 0) {
      return;
    }

    const invalidLot = lots.some(
      (lot) => !lot.lotNo || !lot.quantity
    );

    if (invalidLot) return;

    try {
      const payload = {
        header: form,
        details: lots,
      };

      console.log("Submitting stock-in payload:", payload);

      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading>{t.warehouse.stock_in.title}</Heading>

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root required>
              <Field.Label>{t.products.product_name} <Field.RequiredIndicator/></Field.Label>
              <Combobox.Root collection={collection} value={form.productName ? [form.productName] : []} onValueChange={(details) => { const selected = details.value?.[0]; handleChange("productName", selected); }} onInputValueChange={(e) => filter(e.inputValue)}>
                <Combobox.Control>
                  <Combobox.Input placeholder={t.warehouse.stock_in.typeSearch} />
                  <Combobox.IndicatorGroup>
                    <Combobox.ClearTrigger />
                    <Combobox.Trigger />
                  </Combobox.IndicatorGroup>
                </Combobox.Control>
                <Portal>
                  <Combobox.Positioner>
                    <Combobox.Content>
                      <Combobox.Empty>{t.master.noItems}</Combobox.Empty>
                      {collection.items.map((item) => (
                        <Combobox.Item item={item} key={item.product_code}>{item.product_name}<Combobox.ItemIndicator /></Combobox.Item>
                      ))}
                    </Combobox.Content>
                  </Combobox.Positioner>
                </Portal>
              </Combobox.Root>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.uom.title}<Field.RequiredIndicator/></Field.Label>
              <Select.Root collection={uomCollection} value={uomSelected ? [uomSelected] : []} onValueChange={(details) => setUOMSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.uom.search} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
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

            <Field.Root >
              <Field.Label>{t.warehouse.warehouse}</Field.Label>
              <Input placeholder={t.warehouse.stock_in.warehousePlaceholder} value={form.warehouse} onChange={(e) => handleChange("warehouse", e.target.value)}/>
            </Field.Root>

            <Field.Root required>
              <Field.Label>{t.warehouse.stock_in.receivedDate} <Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={form.receivedDate} onChange={(e) => handleChange("receivedDate", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t.supplier.title}</Field.Label>
              <Input placeholder={t.supplier.supplier_name_placeholder} value={form.supplier} onChange={(e) => handleChange("supplier", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t.warehouse.stock_in.referenceNo}</Field.Label>
              <Input placeholder={t.warehouse.stock_in.referencePlaceholder} value={form.referenceNo} onChange={(e) => handleChange("referenceNo", e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={4} mb={6}>
            <Field.Label>{t.warehouse.stock_in.notes}</Field.Label>
            <Textarea rows={4} placeholder={t.warehouse.stock_in.notesPlaceholder} value={form.notes} onChange={(e) => handleChange("notes", e.target.value)}/>
          </Field.Root>

          {/* ================= Lot Entries ================= */}
          <Heading size="md" mt={6} mb={3}>{t.warehouse.stock_in.lotEntries}</Heading>

          {lots.map((lot, index) => (
            <Card.Root key={lot.id} mb={4}>
              <Card.Body>
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                  <Field.Root>
                    <Field.Label>{t.warehouse.stock_in.lotNumber}</Field.Label>
                    <Input placeholder={t.warehouse.stock_in.lotPlaceholder} value={lot.lotNo} onChange={(e) => handleLotChange(lot.id, "lotNo", e.target.value)}/>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t.warehouse.stock_in.quantity}</Field.Label>
                    <NumberInput.Root w={"100%"} value={lot.quantity.toString()} onValueChange={(details) => handleLotChange(lot.id, "quantity", Number(details.value))}>
                      <NumberInput.Control />
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t.warehouse.stock_in.expiryDate}</Field.Label>
                    <Input type="date" value={lot.expiryDate} onChange={(e) => handleLotChange(lot.id, "expiryDate", e.target.value)}/>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t.warehouse.stock_in.binLocation}</Field.Label>
                    <Input placeholder="Rack A-01" value={lot.binLocation} onChange={(e) => handleLotChange(lot.id, "binLocation", e.target.value)}/>
                  </Field.Root>
                </SimpleGrid>

                <Flex justify="flex-end" mt={3}>
                  <Button size="sm" variant="outline" color="red" borderColor={"red"} onClick={() => handleRemoveLot(lot.id)}>
                   <FaTrash/> {t.master.remove} 
                  </Button>
                </Flex>

              </Card.Body>
            </Card.Root>
          ))}

          <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} mb={4} onClick={handleAddLot}>{t.warehouse.stock_in.addLot}</Button>

          <Flex gap={4} justify="flex-end">
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}  onClick={() => router.back()}>{t.delete_popup.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.warehouse.stock_in.save}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>

    </SidebarWithHeader>
    
  );
}
