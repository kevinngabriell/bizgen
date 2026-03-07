"use client";

import Loading from "@/components/loading";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllProduct, GetProductData } from "@/lib/master/product";
import { getAllListMyWarehouse, GetListMyWarehouseData } from "@/lib/master/warehouse";
import { createStockOutSample, getSearchProductLot, ProductLotSearchData } from "@/lib/warehouse/warehouse";
import {Button, Card, Flex, Field, Heading, Input, NumberInput, Textarea, SimpleGrid, useFilter, useListCollection, createListCollection, Combobox, Portal, Select, Text} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

export default function CreateSampleStockOutPage() {
  //authentication & loading
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //product collection & selection
  const [allProducts, setAllProducts] = useState<GetProductData[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const { contains } = useFilter({ sensitivity: "base"})
  const { collection, set } = useListCollection<GetProductData>({
    initialItems: [],
    itemToString: (item) => item.product_name,
    itemToValue: (item) => item.product_id,
  })

  // product + lot collection (per row)
  const [allProductLots, setAllProductLots] = useState<ProductLotSearchData[]>([]);
  const [productLotCollections, setProductLotCollections] = useState<ProductLotSearchData[][]>([]);

  // per-row framework (stock out type) collection
  const [frameworkCollections, setFrameworkCollections] = useState<typeof frameworks[]>([]);

  //alert success or failed
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  //set warehouse selection
  const [warehouseOptions, setWarehouseOptions] = useState<GetListMyWarehouseData[]>([]);
  const [warehouseSelected, setWarehouseSelected] = useState<string>();
  
  const warehouseCollection = createListCollection({
    items: warehouseOptions.map((warehouse) => ({
      label: `${warehouse.warehouse_name}`,
      value:  warehouse.warehouse_id,
    })),
  });

  const purposeCollection = createListCollection({
    items: frameworks,
  });
  

  useEffect(() => {
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

    const productRes = await getAllProduct(1, 1000);
    const products = productRes?.data ?? [];
    setAllProducts(products);
    set(products);
  
    const lotProductRes = await getSearchProductLot();
    const rawLotData = lotProductRes?.data ?? [];
  
    const productlot: ProductLotSearchData[] = Array.isArray(rawLotData) ? rawLotData : [rawLotData];
  
    setAllProductLots(productlot);
    setProductLotCollections([productlot]);
    setFrameworkCollections([frameworks]);

    setLoading(false);
  }
    
  const [form, setForm] = useState({
    referenceNo: "",
    product_id: "",
    warehouse_id: "",
    requestedBy: "",
    purpose: "",
    notes: "",
  });

  const [lots, setLots] = useState([
    {
      id: crypto.randomUUID(),
      inventory_stock_id: "",
      lotNumber: "",
      quantity: 0,
      availableQty: 0,
      uom: "",
      stockOutType: "",
    },
  ]);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLotChange = (index: number, field: string, value: any) => {
    setLots((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const addLotRow = () => {
    setLots((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        inventory_stock_id: "",
        lotNumber: "",
        quantity: 0,
        availableQty: 0,
        uom: "",
        stockOutType: "",
      },
    ]);

    setProductLotCollections((prev) => [...prev, allProductLots]);
    setFrameworkCollections((prev) => [...prev, frameworks]);
  };

  const removeLotRow = (index: number) => {
    if (lots.length === 1) return;

    setLots((prev) => prev.filter((_, i) => i !== index));
    setProductLotCollections((prev) => prev.filter((_, i) => i !== index));
    setFrameworkCollections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // basic validation
      if (!form.product_id) {
        setIsSuccess(false);
        setTitlePopup("Failed");
        setMessagePopup("Product is required");
        setShowAlert(true);
        return;
      }

      if (!form.warehouse_id) {
        setIsSuccess(false);
        setTitlePopup("Failed");
        setMessagePopup("Warehouse is required");
        setShowAlert(true);
        return;
      }

      console.log(lots);

      if (lots.some(l => !l.lotNumber || !l.quantity || l.quantity <= 0)) {
        setIsSuccess(false);
        setTitlePopup("Failed");
        setMessagePopup("All lot rows must have lot number and valid quantity");
        setShowAlert(true);
        return;
      }

      const payload = {
        action: "SAMPLE",
        warehouse_id: form.warehouse_id,
        product_id: form.product_id,
        date: "",
        reference_no: form.referenceNo,
        notes: form.notes,
        items: lots.map(lot => ({
          inventory_stock_id: lot.inventory_stock_id,
          lot: lot.lotNumber,
          quantity: lot.quantity,
          expired_date: ""
        }))
      };

      await createStockOutSample(payload);

      setIsSuccess(true);
      setTitlePopup("Success");
      setMessagePopup("Stock out created successfully");
      setShowAlert(true);
      router.back();

      setForm({
          referenceNo: "",
          product_id: "",
          warehouse_id: "",
          requestedBy: "",
          purpose: "",
          notes: "",
      });

      setLots([
        {
          id: crypto.randomUUID(),
          inventory_stock_id: "",
          lotNumber: "",
          quantity: 0,
          availableQty: 0,
          uom: "",
          stockOutType: "",
        },
      ]);

    } catch (err: any) {
      setIsSuccess(false);
      setTitlePopup("Error");
      setMessagePopup(err.message || "Failed to create stock sample");
      setShowAlert(true);
    }  finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Card.Root as="form" onSubmit={handleSubmit}>
        <Card.Header>
          <Heading size="md">{t.warehouse.stock_sample.createSampleStockOut}</Heading>
        </Card.Header>

        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
        
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2, lg: 2}} gap={5}>
            <Field.Root>
              <Field.Label>{t.warehouse.stock_sample.referenceNo}</Field.Label>
              <Input placeholder={t.warehouse.stock_sample.autoOptional} value={form.referenceNo} onChange={(e) => handleFormChange("referenceNo", e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.warehouse.stock_sample.productName} <Field.RequiredIndicator/></Field.Label>
              <Combobox.Root 
                collection={collection} 
                value={form.product_id ? [form.product_id] : []} 
                onValueChange={(details) => { const selected = details.value?.[0]; handleFormChange("product_id", selected); }} 
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
              <Field.Label>{t.warehouse.stock_sample.purposeOfSample} <Field.RequiredIndicator/></Field.Label>
              <Select.Root
                collection={purposeCollection}
                value={form.purpose ? [form.purpose] : []}
                onValueChange={(details) => {
                  const value = details.value?.[0];
                  handleFormChange("purpose", value);
                }}
                size="sm"
                width="100%"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select purpose" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {purposeCollection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Field.Root>
                  <Field.Root required>
                          <Field.Label>{t.warehouse.stock_out.warehouseLocation} <Field.RequiredIndicator/></Field.Label>
                          <Select.Root collection={warehouseCollection} value={warehouseSelected ? [warehouseSelected] : []} onValueChange={(details) => {
                            const value = details.value[0];
                            setWarehouseSelected(value);
                            handleFormChange("warehouse_id", value);
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
          </SimpleGrid>
          
          <Field.Root mt={4}>
            <Field.Label>{t.warehouse.stock_sample.notes}</Field.Label>
            <Textarea placeholder={t.warehouse.stock_sample.additionalRemarksOptional} value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)}/>
          </Field.Root>

          <Heading size="sm" mt={6} mb={3}>{t.warehouse.stock_sample.lotDetails}</Heading>

          {lots.map((lot, index) => (
            <Card.Root key={index} mb={4} p={4}>
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems={"center"}>
                <Field.Root required>
                  <Field.Label>{t.warehouse.stock_sample.lotBatchNo} <Field.RequiredIndicator/></Field.Label>
                    <Combobox.Root
                      w={"100%"}
                      key={`lot-number-${lot.id}`}
                      collection={createListCollection<ProductLotSearchData>({
                        items: productLotCollections[index] ?? [],
                        itemToString: (item) => `${item.product_name} - ${item.lot_no}`,
                        itemToValue: (item) => item.inventory_stock_id,
                      })}
                      value={lot.inventory_stock_id ? [lot.inventory_stock_id] : []}
                      onValueChange={(details) => {
                        const selected = details.value?.[0];

                        const selectedLot = allProductLots.find(
                          (item) => item.inventory_stock_id === selected
                        );

                        setLots((prev) => {
                          const updated = [...prev];
                          updated[index] = {
                            ...updated[index],
                            inventory_stock_id: selected,
                            lotNumber: selectedLot?.lot_no ?? "",
                            quantity: 0,
                            availableQty: selectedLot?.qty ?? 0,
                          };
                          return updated;
                        });
                      }}
                      onInputValueChange={(e) => {
                        const input = e.inputValue ?? "";

                        const filtered = allProductLots.filter((item) =>
                          `${item.product_name} - ${item.lot_no}`
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        );

                        setProductLotCollections((prev) => {
                          const updated = [...prev];
                          updated[index] = filtered;
                          return updated;
                        });
                      }}
                    >
                      <Combobox.Control>
                        <Combobox.Input placeholder={t.warehouse.stock_out.lotPlaceholder} />
                        <Combobox.IndicatorGroup>
                          <Combobox.ClearTrigger />
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>{t.master.noItems}</Combobox.Empty>
                            {(productLotCollections[index] ?? []).map((item) => (
                              <Combobox.Item
                                item={item}
                                key={`${item.product_id}-${item.lot_no}`}
                              >
                                {item.product_name} - {item.lot_no}
                                <Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t.warehouse.stock_sample.quantity} <Field.RequiredIndicator/></Field.Label>
                    <Input
                      type="number"
                      min="1"
                      max={lot.availableQty}
                      value={lot.quantity}
                      onChange={(e) => {
                        const value = Number(e.target.value);

                        if (value > lot.availableQty) {
                          setIsSuccess(false);
                          setShowAlert(true);
                          setTitlePopup("Invalid Quantity");
                          setMessagePopup(`Max available qty is ${lot.availableQty}`);
                          
                          return;
                        }

                        handleLotChange(index, "quantity", value);
                      }}
                    />
                    <Text fontSize="xs" color="gray.500">
                      Available: {lot.availableQty}
                    </Text>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.warehouse.stock_sample.unit}</Field.Label>
                  <Input placeholder={t.warehouse.stock_out.uomPlaceholder} value={lot.uom} onChange={(e) => handleLotChange(index, "unit", e.target.value)}/>
                </Field.Root>

                <Flex justify="flex-end">
                  <Button size="sm" w={"100%"} variant="outline" color={"red"} borderColor={"red"} onClick={() => removeLotRow(index)}>
                    Remove <FaTrash/>
                  </Button>
                </Flex>
              </SimpleGrid>
            </Card.Root>
          ))}

          <Button mt={2}  variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}  onClick={addLotRow}>{t.warehouse.stock_sample.addLot}</Button>

          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.master.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} type="submit"  onClick={handleSubmit}>{t.warehouse.stock_sample.saveSampleStockOut}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
  );
}

const frameworks = [
  { label: "Customer", value: "customer" },
  { label: "Distributor", value: "distributor" },
  { label: "Reseller", value: "reseller" },
  { label: "Marketing", value: "marketing" },
  { label: "Internal Testing", value: "internal_testing" },
  { label: "R&D", value: "r_d" },
  { label: "Event", value: "event" },
  { label: "Staff", value: "staff" },
  { label: "Other", value: "other" }
]