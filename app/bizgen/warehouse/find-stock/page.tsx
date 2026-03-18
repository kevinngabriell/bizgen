"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllProduct, GetProductData } from "@/lib/master/product";
import { getSearchProductLot, getWarehouseReportLot, getWarehouseReportProductID, ProductLotSearchData, WarehouseLotReportData, WarehouseProductIDReportData } from "@/lib/warehouse/warehouse";
import { Flex, Heading, Text, Button, Table, Box, SimpleGrid, Combobox, Portal, createListCollection, Field } from "@chakra-ui/react";
import { MarsStroke } from "lucide-react";
import { useEffect, useState } from "react";

export default function FindStock() {
    //authentication & loading
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    const [productSearch, setProductSearch] = useState("");
    const [lotSearch, setLotSearch] = useState("");
    const [showResult, setShowResult] = useState(false);

    // product
    const [allProduct, setAllProduct] = useState<GetProductData[]>([]);
    const [productCollection, setProductCollection] = useState<GetProductData[][]>([]);
    const [selectedProduct, setSelectedProduct] = useState("");

    // lot
    const [allLot, setAllLot] = useState<ProductLotSearchData[]>([]);
    const [lotCollection, setLotCollection] = useState<ProductLotSearchData[][]>([]);
    const [selectedLot, setSelectedLot] = useState("");

    const [lotByProduct, setLotByProduct] = useState<WarehouseProductIDReportData>();
    const [lotByLot, setLotByLot] = useState<WarehouseLotReportData>();

    useEffect(() => {
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

        //product calling API
        const productRes = await getAllProduct(1, 1000);
        const rawProductData = productRes?.data ?? [];
        const product: GetProductData[] = Array.isArray(rawProductData) ? rawProductData : [rawProductData];
          
        setAllProduct(product);
        setProductCollection([product]);

        //lot calling API
        const lotRes = await getSearchProductLot();
        const rawLotRes = lotRes?.data ?? [];
        const lot: ProductLotSearchData[] = Array.isArray(rawLotRes) ? rawLotRes : [rawLotRes];
          
        setAllLot(lot);

        // group lots by lot_no on initial load
        const uniqueLotMap = new Map();
        lot.forEach((item) => {
          if (!uniqueLotMap.has(item.lot_no)) {
            uniqueLotMap.set(item.lot_no, item);
          }
        });

        const groupedInitialLots = Array.from(uniqueLotMap.values());
        setLotCollection([groupedInitialLots]);

        setLoading(false);
    }
    
    const handleSearch = async () => {
        if (!productSearch && !lotSearch) {
            setShowResult(false);
            return;
        }

        if(productSearch){
            try {
                setLoading(true);
                const reportProductRes = await getWarehouseReportProductID(selectedProduct);
                setLotByProduct(reportProductRes.data);
            } catch (error:any) {
                
            } finally {
                setLoading(false);
            }
        }

        if(lotSearch){
            try {
                setLoading(true);
                const reportLotRes = await getWarehouseReportLot(selectedLot);
                setLotByLot(reportLotRes.data)
            } catch (error:any) {
                
            } finally {
                setLoading(false);
            }
        }

        // nanti disini bisa panggil API cari stock
        setShowResult(true);
    };

    if (loading) return <Loading/>;

    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Flex direction="column" gap={6}>
                <Heading size="lg">{t.warehouse.find_stock.find_stock}</Heading>

                <Box borderWidth={0.5} borderRadius="lg" p={6} bg="white" boxShadow="sm">
                    <Flex direction="column" gap={5}>
                        <Text fontSize="sm" color="gray.500">{t.warehouse.find_stock.find_stock_desc}</Text>

                        <SimpleGrid columns={{base: 1, md: 3, lg: 3}} gap={4} alignItems={"center"}>
                            <Field.Root>
                                <Field.Label>{t.products.product_name}</Field.Label>
                                <Combobox.Root collection={createListCollection<GetProductData>({
                                    items: (productCollection[0] ?? allProduct) ?? [],
                                    itemToString: (item) => item.product_name,
                                    itemToValue: (item) => item.product_id
                                })}
                                value={selectedProduct ? [selectedProduct] : []}
                                onValueChange={(details) => {
                                    const selected = details.value?.[0];

                                    const product = allProduct.find(
                                        (item) => item.product_id === selected
                                    );

                                    setSelectedProduct(product?.product_id ?? "");
                                    setProductSearch(product?.product_name ?? "");
                                }}
                                onInputValueChange={(details) => {
                                  const value = details.inputValue ?? "";
                                  setProductSearch(value);

                                  const filtered = (allProduct ?? []).filter((item) =>
                                    item.product_name?.toLowerCase().includes(value.toLowerCase())
                                  );

                                  setProductCollection([filtered]);
                                }}
                                >
                                  <Combobox.Control>
                                    <Combobox.Input placeholder={t.products.product_name_placeholder} value={productSearch}/>
                                    <Combobox.IndicatorGroup>
                                      <Combobox.ClearTrigger />
                                      <Combobox.Trigger />
                                    </Combobox.IndicatorGroup>
                                  </Combobox.Control>

                                  <Portal>
                                    <Combobox.Positioner>
                                      <Combobox.Content>
                                        <Combobox.Empty>{t.master.noItems}</Combobox.Empty>
                                        {((productCollection[0] ?? allProduct) ?? []).map((item) => (
                                          <Combobox.Item item={item} key={`${item.product_id}`}>
                                              {item.product_name}
                                              <Combobox.ItemIndicator />
                                          </Combobox.Item>
                                        ))}

                                      </Combobox.Content>
                                    </Combobox.Positioner>
                                  </Portal>
                                </Combobox.Root>
                            </Field.Root>

                            <Field.Root>
                                <Field.Label>{t.warehouse.stock_in.lotNumber}</Field.Label>
                                <Combobox.Root 
                                collection={createListCollection<ProductLotSearchData>({
                                    items: (lotCollection[0] ?? allLot) ?? [],
                                    itemToString: (item) => `${item.lot_no} - ${item.product_name}`,
                                    itemToValue: (item) => item.lot_no
                                })}
                                value={selectedLot ? [selectedLot] : []}
                                onValueChange={(details) => {
                                    const selected = details.value?.[0] ?? "";
                                    setSelectedLot(selected);
                                    setLotSearch(selected);
                                }}
                                onInputValueChange={(details) => {
                                  const value = details.inputValue ?? "";
                                  setLotSearch(value);

                                  const filtered = (allLot ?? []).filter((item) =>
                                    item.lot_no?.toLowerCase().includes(value.toLowerCase())
                                  );

                                  // group by lot_no so duplicates only appear once
                                  const uniqueMap = new Map();
                                  filtered.forEach((item) => {
                                    if (!uniqueMap.has(item.lot_no)) {
                                      uniqueMap.set(item.lot_no, item);
                                    }
                                  });

                                  const groupedLots = Array.from(uniqueMap.values());

                                  setLotCollection([groupedLots]);
                                }}
                                >
                                  <Combobox.Control>
                                    <Combobox.Input placeholder={t.warehouse.stock_in.lotPlaceholder} value={lotSearch}/>
                                    <Combobox.IndicatorGroup>
                                      <Combobox.ClearTrigger />
                                      <Combobox.Trigger />
                                    </Combobox.IndicatorGroup>
                                  </Combobox.Control>

                                  <Portal>
                                    <Combobox.Positioner>
                                      <Combobox.Content>
                                        <Combobox.Empty>{t.master.noItems}</Combobox.Empty>
                                        {((lotCollection[0] ?? allLot) ?? []).map((item) => (
                                          <Combobox.Item item={item} key={`${item.lot_no}-${item.product_id ?? "lot"}`}>
                                              {item.lot_no}
                                              <Combobox.ItemIndicator />
                                          </Combobox.Item>
                                        ))}

                                      </Combobox.Content>
                                    </Combobox.Positioner>
                                  </Portal>
                                </Combobox.Root>
                            </Field.Root>
                            
                            <Button w={"40%"} bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSearch}>{t.warehouse.find_stock.button}</Button>
                        </SimpleGrid>
                    </Flex>
                </Box>

                {!showResult && (
                    <Flex borderWidth={2} minH={"40vh"} bg="white" boxShadow="md" borderColor={"gray.300"} borderRadius={"lg"} align={"center"} justify={"center"} direction={"column"} textAlign={"center"} gap={3} >
                        <Text fontSize="3xl">🔎</Text>
                        <Text fontSize="xl" fontWeight="semibold" color="gray.700">{t.warehouse.find_stock.no_found}</Text>
                        <Text color="gray.500">{t.warehouse.find_stock.no_found_2}</Text>
                        <Text color="gray.400" fontSize="sm">{t.warehouse.find_stock.no_found_3}</Text>
                    </Flex>
                )}

                {showResult && (
                    <Box borderWidth={2} bg="white"
                        boxShadow="md"
                        borderRadius="lg" borderColor={"gray.300"} p={4}>
                        <Box mb={4}>
                            <Heading size="md">{t.warehouse.find_stock.product} {lotByProduct?.product_name}</Heading>
                            <Text fontSize="sm" color="gray.500">{t.warehouse.find_stock.warehouse} {lotByProduct?.warehouse_name}</Text>
                        </Box>
                        
                        <Table.Root w={"100%"} size="sm">
                            <Table.Header bg="gray.50">
                                <Table.Row>
                                <Table.ColumnHeader>{t.warehouse.find_stock.transaction_type}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t.warehouse.stock_in.lotNumber}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t.warehouse.find_stock.transaction_date}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t.warehouse.find_stock.Qty}</Table.ColumnHeader>
                                <Table.ColumnHeader>{t.warehouse.find_stock.total_qty}</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {lotByProduct?.lots.map((lot) => (
                                <>
                                    <Table.Row key={`lot-${lot.lot_no}`} bg="gray.50">
                                    <Table.Cell colSpan={5} fontWeight="bold">
                                        Lot: {lot.lot_no}
                                    </Table.Cell>
                                    </Table.Row>

                                    {lot.transactions.map((trx) => (
                                    <Table.Row key={trx.inventory_transaction_id} _hover={{ bg: "gray.50" }}>
                                        <Table.Cell>{trx.transaction_type}</Table.Cell>
                                        <Table.Cell>{lot.lot_no}</Table.Cell>
                                        <Table.Cell>{trx.date}</Table.Cell>
                                        <Table.Cell>{trx.qty}</Table.Cell>
                                        <Table.Cell>{trx.total_qty}</Table.Cell>
                                    </Table.Row>
                                    ))}
                                </>
                                ))}

                                {lotByLot?.lots &&
                                lotByLot.lots.map((trx) => (
                                    <Table.Row key={trx.inventory_transaction_id} _hover={{ bg: "gray.50" }}>
                                    <Table.Cell>{trx.transaction_type}</Table.Cell>
                                    <Table.Cell>{lotByLot.lot_no}</Table.Cell>
                                    <Table.Cell>{trx.qty}</Table.Cell>
                                    <Table.Cell>{trx.total_qty}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>

                        <Flex gap={3} justify="flex-end" mt={4}>
                            <Button variant="outline" borderColor="#E77A1F" color="#E77A1F">{t.master.downloadPDF}</Button>

                            <Button bg="#E77A1F" color="white">{t.master.downloadExcel}</Button>
                        </Flex>
                    </Box>
                )}
            </Flex>
        </SidebarWithHeader>
    );
}