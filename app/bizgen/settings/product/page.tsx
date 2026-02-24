"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ProductDialog from "./productDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createProduct, deleteProduct, getAllProduct, GetProductData, updateProduct } from "@/lib/master/product";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { FiEdit, FiTrash } from "react-icons/fi";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";

export default function SettingProduct(){
    //authentication & loading variable
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    //related to product variable
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [productPage, setProductPage] = useState(1);
    const [productPagination, setProductPagination] = useState({ total_pages: 1, page: 1 });
    const [findProduct, setFindProduct] = useState('');
    const [productData, setProductData] = useState<GetProductData[]>([]);
    const [editingProduct, setEditingProduct] = useState<GetProductData | null>(null);

    //alert & success variable
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    useEffect(() => {
        init();
    }, [productPage]);

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

        try {
            const productRes = await getAllProduct(productPage, 10, findProduct);
            setProductData(productRes.data);
            setProductPagination((prev) => ({
                ...prev,
                total_pages: productRes.pagination?.total_pages || 1,
                page: productPage,
            }));

        } catch (error: any){
            setProductData([]);

        } finally {
            setLoading(false);
        }
    }

    const handleCreateProduct  = async(data: {
        product_code: string;
        product_name: string;
        product_description: string;
    }) => {
        try {
            setLoading(true);
            await createProduct(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.products.success_product_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsProductOpen(false);
            init();
        } catch (err: any) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(err.message || t.master.error_msg);
            setTimeout(() => setShowAlert(false), 6000);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateProduct  = async(data: {
        product_id: string;
        product_code: string;
        product_name: string;
        product_description: string;
    }) => {
        try {
            setLoading(true);
            await updateProduct(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.products.success_product_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsProductOpen(false);
            init();
        } catch (err: any) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(err.message || t.master.error_msg);
            setTimeout(() => setShowAlert(false), 6000);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenProductDialog = () => {
        setIsProductOpen(true);
    };

    const handleDeleteProduct = async({ product_id }: { product_id: string }) => {
        try {
            setLoading(true);
            await deleteProduct(product_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.products.success_product_delete);
            setTimeout(() => setShowAlert(false), 8000);
            init();
        } catch (error : any){
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(t.master.error_msg + error.message);
            setTimeout(() => setShowAlert(false), 8000);
            init();
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loading/>;

    return(
        <SidebarWithHeader username={auth?.username ?? ""} daysToExpire={auth?.days_remaining ?? 0}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"} alignItems={"center"}>
                <Heading mb={6} width={"100%"} height={"100%"}>{t.products.title}</Heading>
                
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.products.search} bg={"white"} value={findProduct}
                            onChange={(e) => setFindProduct(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setProductPage(1);
                                    init();
                                }
                            }} width="250px"
                        />
                    </InputGroup>
                
                <Button bg="#E77A1F" color="white" onClick={handleOpenProductDialog}>
                    {t.products.create_button}
                </Button>
            </Flex>
            </Flex>           

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <ProductDialog isOpen={isProductOpen} 
                setIsOpen={(open) => {
                    setIsProductOpen(open);
                    if (!open) setEditingProduct(null);
                }}
                title={editingProduct ? t.products.update_button : t.products.create_button}
                placeholders={editingProduct ? { product_id: editingProduct.product_id, product_code: editingProduct.product_code, product_name: editingProduct.product_name, product_description: editingProduct.product_description } : undefined}
                onSubmit={(data) => {
                    if (editingProduct) {
                        handleUpdateProduct({
                            product_id: data.product_id ?? editingProduct.product_id,
                            product_code: data.product_code,
                            product_name: data.product_name,
                            product_description: data.product_description,
                        });
                    } else {
                        handleCreateProduct({
                            product_code: data.product_code,
                            product_name: data.product_name,
                            product_description: data.product_description,
                        });
                    }
                }}
            />

            <Table.Root mt={7}>
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.products.product_code}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.products.product_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.products.product_description}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>                    
                </Table.Header>

                <Table.Body>
                    {productData.map((product) => (
                    <Table.Row key={product.product_id}>
                        <Table.Cell textAlign={"center"}>{product.product_code}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{product.product_name}</Table.Cell>

                        {/* If more than 60 chracters then trim product description*/}
                        <Table.Cell textAlign={"center"}>{product.product_description.length > 60 ? product.product_description.substring(0, 60) + "..." : product.product_description}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingProduct(product);
                                        setIsProductOpen(true);
                                    }}
                                />
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash color="red"/>
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>{t.delete_popup.title}</Dialog.Title>
                                                </Dialog.Header>

                                                 <Dialog.Body>
                                                    <Text>{t.delete_popup.description}</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">{t.delete_popup.cancel}</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteProduct({ product_id: product.product_id })}>{t.delete_popup.delete}</Button>
                                                </Dialog.Footer>
                                                
                                                <Dialog.CloseTrigger asChild>
                                                    <CloseButton size="sm" />
                                                </Dialog.CloseTrigger>

                                            </Dialog.Content>
                                        </Dialog.Positioner>
                                    </Portal>

                                </Dialog.Root>
                            </Flex>
                        </Table.Cell>
                    </Table.Row>
                    ))}
                </Table.Body>                
            </Table.Root> 

            <Flex display={"flex"} justify="flex-end" alignItems={"end"} width={"100%"} mt={"3"}>
                <Pagination.Root count={productPagination.total_pages}pageSize={1} page={productPage} onPageChange={(details) => setProductPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                    <Pagination.PrevTrigger asChild>
                        <IconButton>
                        <LuChevronLeft />
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.Items render={(page) => (
                            <IconButton key={page.value} variant={page.value === productPage ? "outline" : "ghost"} onClick={() => setProductPage(page.value)}>{page.value} </IconButton>
                    )}/>

                    <Pagination.NextTrigger asChild>
                        <IconButton>
                        <LuChevronRight />
                        </IconButton>
                    </Pagination.NextTrigger>
                    </ButtonGroup>
                </Pagination.Root>

            </Flex>            

        </SidebarWithHeader>
    );
}