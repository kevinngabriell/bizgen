"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import SupplierDialog from "./supplierdialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createSupplier, deleteSupplier, getAllSupplier, GetSupplierData, updateSupplier, updateSupplierData } from "@/lib/master/supplier";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiEdit, FiTrash } from "react-icons/fi";
import { getLang } from "@/lib/i18n";

export default function SettingSupplier(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSupplierOpen, setIsSupplierOpen] = useState(false);

    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierPagination, setSupplierPagination] = useState({ total_pages: 1, page: 1 });
    const [findSupplier, setFindSupplier] = useState('');
    const [supplierData, setSupplierData] = useState<GetSupplierData[]>([]);
    const [editingSupplier, setEditingSupplier] = useState<GetSupplierData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    useEffect(() => {
        init();
    }, [supplierPage]);

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
            const supplierRes = await getAllSupplier(supplierPage, 10, findSupplier);
            setSupplierData(supplierRes.data);
            setSupplierPagination((prev) => ({
                ...prev,
                total_pages: supplierRes.pagination?.total_pages || 1,
                page: supplierPage,
            }));

        } catch (error: any){
            setSupplierData([]);

        } finally {
            setLoading(false);
        }
    }    

    const handleCreateSupplier  = async(data: {
        supplier_name: string;
        supplier_origin: string;
        supplier_address: string;
        supplier_phone: string;
        supplier_pic_name: string;
        supplier_pic_contact: string;
        supplier_currency: string;
        supplier_term: string;
        supplier_bank_information: string;
    }) => {
        try {
            setLoading(true);
            await createSupplier(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.supplier.success_supplier_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsSupplierOpen(false);
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

    const handleUpdateSupplier = async (data: updateSupplierData) =>  {
        try {
            setLoading(true);
            await updateSupplier(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.supplier.success_supplier_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsSupplierOpen(false);
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
    
    const handleOpenSupplierDialog = () => {
        setIsSupplierOpen(true);
    };

    const handleDeleteSupplier = async({ supplier_id }: { supplier_id: string }) => {
        try {
            setLoading(true);
            await deleteSupplier(supplier_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.supplier.success_supplier_delete);
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
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>{t.supplier.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.supplier.search} bg={"white"} value={findSupplier}
                            onChange={(e) => setFindSupplier(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setSupplierPage(1);
                                    init();
                                }
                            }}
                            width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenSupplierDialog}>{t.supplier.create_button}</Button>
                </Flex>
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <SupplierDialog 
                isOpen={isSupplierOpen}
                setIsOpen={(open) => {
                    setIsSupplierOpen(open);
                    if (!open) setEditingSupplier(null);
                }}
                title={editingSupplier ? t.supplier.update_button : t.supplier.create_button}
                placeholders={editingSupplier ? { 
                    supplier_id: editingSupplier.supplier_id,
                    supplier_name: editingSupplier.supplier_name, 
                    supplier_phone: '', 
                    supplier_address: '',
                    supplier_origin: editingSupplier.supplier_origin,
                    supplier_pic_name: '',
                    supplier_pic_contact: '',
                    supplier_currency: '',
                    supplier_term: '',
                    supplier_bank_information: ''
                } 
                : undefined}
                onSubmit={(data) => {
                    if(editingSupplier){
                        handleUpdateSupplier({
                            supplier_id: data.supplier_id ?? editingSupplier.supplier_id,
                            supplier_name: data.supplier_name,
                            supplier_phone: data.supplier_phone,
                            supplier_address: data.supplier_address,
                            supplier_bank_information: data.supplier_bank_information,
                            supplier_currency: data.supplier_currency,
                            supplier_origin: data.supplier_origin,
                            supplier_pic_contact: data.supplier_pic_contact,
                            supplier_pic_name: data.supplier_pic_name,
                            supplier_term: data.supplier_term
                        });
                    } else {
                        handleCreateSupplier({
                            supplier_name: data.supplier_name,
                            supplier_origin: data.supplier_origin,
                            supplier_address: data.supplier_address,
                            supplier_phone: data.supplier_phone,
                            supplier_pic_name: data.supplier_pic_name,
                            supplier_pic_contact: data.supplier_pic_contact,
                            supplier_currency: data.supplier_currency,
                            supplier_term: data.supplier_term,
                            supplier_bank_information: data.supplier_bank_information
                        });
                    }
                }}
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.supplier.supplier_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.supplier.supplier_origin}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.supplier.supplier_currency}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>  
                
                <Table.Body>
                    {supplierData?.map((supplier) => (
                    <Table.Row key={supplier.supplier_id}>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_origin}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_currency}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingSupplier(supplier);
                                        setIsSupplierOpen(true);
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteSupplier({ supplier_id: supplier.supplier_id })}>{t.delete_popup.delete}</Button>
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
                <Pagination.Root
                    count={supplierPagination.total_pages}pageSize={1} 
                    page={supplierPage} onPageChange={(details) => setSupplierPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === supplierPage ? "outline" : "ghost"} onClick={() => setSupplierPage(page.value)}
                                >
                                    {page.value}
                                </IconButton>
                            )}
                        />

                        <Pagination.NextTrigger asChild>
                            <IconButton><LuChevronRight /></IconButton>
                        </Pagination.NextTrigger>
                    </ButtonGroup>
                </Pagination.Root>
            </Flex>        

        </SidebarWithHeader>
        // settings

    );
}