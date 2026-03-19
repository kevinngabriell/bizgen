"use client";

import {Button, Flex, Field, Heading, Input, NumberInput, SimpleGrid, Textarea, Card, useFilter, useListCollection, createListCollection, Select, Combobox, Portal} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllProduct, GetProductData } from "@/lib/master/item";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import { FaTrash } from "react-icons/fa";
import { getAllListMyWarehouse, GetListMyWarehouseData } from "@/lib/master/warehouse";
import { createStockIn } from "@/lib/warehouse/warehouse";
import { AlertMessage } from "@/components/ui/alert";

export default function CreateStockInPage() {
  //authentication & loading
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //product collection & selection
  const [allProducts, setAllProducts] = useState<GetProductData[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const { contains } = useFilter({ sensitivity: "base"})
  const { collection, set } = useListCollection<GetProductData>({
    initialItems: [],
    itemToString: (item) => item.product_name,
    itemToValue: (item) => item.product_id,
  })

  //router authentication
  const router = useRouter();

  //alert success or failed
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

  //set warehouse selection
  const [warehouseOptions, setWarehouseOptions] = useState<GetListMyWarehouseData[]>([]);
  const [warehouseSelected, setWarehouseSelected] = useState<string>();

  const warehouseCollection = createListCollection({
    items: warehouseOptions.map((warehouse) => ({
      label: `${warehouse.warehouse_name}`,
      value:  warehouse.warehouse_id,
    })),
  });

  useEffect(() => {
    //retrieve uom
    const fetchUOM = async () => {
      try {
        const uomRes = await getAllUOM(1, 1000);
        setUOMOptions(uomRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setUOMOptions([]);
      }
    };

    //retrieve warehouse
    const fetchWarehouse = async () => {
      try {
        const warehouseRes = await getAllListMyWarehouse(1, 1000);
        setWarehouseOptions(warehouseRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setWarehouseOptions([]);
      }
    }
    
    fetchUOM();
    fetchWarehouse();
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

    //set product data option
    const productRes = await getAllProduct(1, 1000);
    const products = productRes?.data ?? [];
    setAllProducts(products);
    set(products);

    setLoading(false);
  }

  const [form, setForm] = useState({
    product_id: "",
    warehouse_id: "",
    uom_id: "",
    received_date: "",
    supplier_name: "",
    reference_no: "",
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

    if (!form.product_id) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(t.products.product_name + " is required");
      return;
    }

    if (!form.uom_id) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(t.uom.title + " is required");
      return;
    }

    if (!form.warehouse_id) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(t.warehouse.warehouse + " is required");
      return;
    }

    if (!form.received_date) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(t.warehouse.stock_in.receivedDate + " is required");
      return;
    }

    if (lots.length === 0) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(t.warehouse.stock_in.lotEntries + " is required");
      return;
    }

    const invalidLot = lots.some(
      (lot) => !lot.lotNo || !lot.quantity
    );

    if (invalidLot) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup("Lot number and quantity must be filled");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        action: "IN",
        warehouse_id: form.warehouse_id,
        product_id: form.product_id,
        date: form.received_date,
        reference_no: form.reference_no,
        notes: form.notes,
        items: lots.map((lot) => ({
          inventory_stock_id: "",
          lot: lot.lotNo,
          quantity: lot.quantity,
          expired_date: lot.expiryDate,
        }))
      };
      await createStockIn(payload);
      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.origin.success_origin_create);
      router.back();
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.master.error_msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Heading>{t.warehouse.stock_in.title}</Heading>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
      
      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root required>
              <Field.Label>{t.products.product_name} <Field.RequiredIndicator/></Field.Label>
              <Combobox.Root 
                collection={collection} 
                value={form.product_id ? [form.product_id] : []} 
                onValueChange={(details) => { 
                  const selected = details.value?.[0]; 
                  handleChange("product_id", selected); 
                }} 
                onInputValueChange={(e) => {
                  const input = e.inputValue ?? "";
                  setSelectedProduct(input);
                  const filtered = allProducts.filter((item) =>
                    contains(item.product_name, input)
                  );
                set(filtered);
                }}>
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
              <Select.Root 
                collection={uomCollection} 
                value={uomSelected ? [uomSelected] : []} 
                onValueChange={(details) => {
                  const value = details.value[0];
                  setUOMSelected(value);
                  handleChange("uom_id", value);
                }} 
                width="100%">
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
              <Select.Root collection={warehouseCollection} value={warehouseSelected ? [warehouseSelected] : []} onValueChange={(details) => {
                const value = details.value[0];
                setWarehouseSelected(value);
                handleChange("warehouse_id", value);
              }} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.warehouse.stock_in.warehousePlaceholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {warehouseCollection.items.map((wr) => (
                        <Select.Item item={wr} key={wr.value}>{wr.label}<Select.ItemIndicator /></Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>

            <Field.Root required>
              <Field.Label>{t.warehouse.stock_in.receivedDate} <Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={form.received_date} onChange={(e) => handleChange("received_date", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t.supplier.title}</Field.Label>
              <Input placeholder={t.supplier.supplier_name_placeholder} value={form.supplier_name} onChange={(e) => handleChange("supplier_name", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t.warehouse.stock_in.referenceNo}</Field.Label>
              <Input placeholder={t.warehouse.stock_in.referencePlaceholder} value={form.reference_no} onChange={(e) => handleChange("reference_no", e.target.value)}/>
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
