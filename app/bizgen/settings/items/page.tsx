"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ProductDialog from "./productDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
// import { createProduct, deleteProduct, getAllProduct, GetProductData, updateProduct } from "@/lib/master/item";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { FiEdit, FiTrash } from "react-icons/fi";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";
import { createItem, deleteItem, getAllItem, GetItemData, updateItem } from "@/lib/master/item";

export default function SettingItem(){
    //authentication & loading variable
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    //related to product variable
    const [isItemOpen, setIsItemOpen] = useState(false);
    const [itemPage, setItemPage] = useState(1);
    const [itemPagination, setItemPagination] = useState({ total_pages: 1, page: 1 });
    const [findItem, setFindItem] = useState('');
    const [itemData, setItemData] = useState<GetItemData[]>([]);
    const [editingItem, setEditingItem] = useState<GetItemData | null>(null);

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
    }, [itemPage]);

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
            const itemRes = await getAllItem(itemPage, 10, findItem);
            setItemData(itemRes.data);
            setItemPagination((prev) => ({
                ...prev,
                total_pages: itemRes.pagination?.total_pages || 1,
                page: itemPage,
            }));

        } catch (error: any){
            setItemData([]);

        } finally {
            setLoading(false);
        }
    }

    const handleCreateItem  = async(data: {
        item_code: string;
        item_name: string;
        item_description: string;
        item_type: string;
    }) => {
        try {
            setLoading(true);
            await createItem({ ...data });
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.products.success_product_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsItemOpen(false);
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

    const handleUpdateItem  = async(data: {
        item_id: string;
        item_code: string;
        item_name: string;
        item_description: string;
        item_type: string;
    }) => {
        try {
            setLoading(true);
            await updateItem(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.products.success_product_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsItemOpen(false);
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
        setIsItemOpen(true);
    };

    const handleDeleteItem = async({ item_id }: { item_id: string }) => {
        try {
            setLoading(true);
            await deleteItem(item_id);
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
                        <Input placeholder={t.products.search} bg={"white"} value={findItem}
                            onChange={(e) => setFindItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setItemPage(1);
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

            <ProductDialog isOpen={isItemOpen} 
                setIsOpen={(open) => {
                    setIsItemOpen(open);
                    if (!open) setEditingItem(null);
                }}
                title={editingItem ? t.products.update_button : t.products.create_button}
                placeholders={editingItem ? { item_id: editingItem.item_id, item_code: editingItem.item_code, item_name: editingItem.item_name, item_description: editingItem.item_description, item_type: editingItem.item_type } : undefined}
                onSubmit={(data) => {
                    if (editingItem) {
                        handleUpdateItem({
                            item_id: data.item_id ?? editingItem.item_id,
                            item_code: data.item_code,
                            item_name: data.item_name,
                            item_description: data.item_description,
                            item_type: data.item_type,
                        });
                    } else {
                        handleCreateItem({
                            item_code: data.item_code,
                            item_name: data.item_name,
                            item_description: data.item_description,
                            item_type: data.item_type,
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
                    {itemData.map((product) => (
                    <Table.Row key={product.item_id}>
                        <Table.Cell textAlign={"center"}>{product.item_code}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{product.item_name}</Table.Cell>

                        {/* If more than 60 chracters then trim product description*/}
                        <Table.Cell textAlign={"center"}>{product.item_description.length > 60 ? product.item_description.substring(0, 60) + "..." : product.item_description}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingItem(product);
                                        setIsItemOpen(true);
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteItem({ item_id: product.item_id })}>{t.delete_popup.delete}</Button>
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
                <Pagination.Root count={itemPagination.total_pages}pageSize={1} page={itemPage} onPageChange={(details) => setItemPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                    <Pagination.PrevTrigger asChild>
                        <IconButton>
                        <LuChevronLeft />
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.Items render={(page) => (
                            <IconButton key={page.value} variant={page.value === itemPage ? "outline" : "ghost"} onClick={() => setItemPage(page.value)}>{page.value} </IconButton>
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