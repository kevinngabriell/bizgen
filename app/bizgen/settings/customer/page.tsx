"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import CustomerDialog from "./customerdialog";
import { useEffect, useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createCustomer, deleteCustomer, getAllCustomer, getDetailCustomer, GetCustomerData, updateCustomer } from "@/lib/master/customer";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";

export default function SettingCustomer(){
    const [loading, setLoading] = useState(false);
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);

    const [editingCustomer, setEditingCustomer] = useState<GetCustomerData | null>(null);
    const [customerPage, setCustomerPage] = useState(1);
    const [customerPagination, setCustomerPagination] = useState({ total_pages: 1, page: 1 });
    const [findCustomer, setFindCustomer] = useState('');
    const [customerData, setCustomerData] = useState<GetCustomerData[]>([]);
    
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const t = getLang("en"); 

    useEffect(() => {
        init();
    }, [customerPage]);

    const init = async () => {
        setLoading(true);
        
        const valid = await checkAuthOrRedirect();
        if(!valid) return;
        
        const info = getAuthInfo();
        setAuth(info);

        try {
            const customerRes = await getAllCustomer(customerPage, 10, findCustomer);
            setCustomerData(customerRes.data);
            setCustomerPagination((prev) => ({
                ...prev,
                total_pages: customerRes.pagination?.total_pages || 1,
                page: customerPage,
            }));

        } catch (error : any){
            setCustomerData([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loading/>;

    const handleCreateCustomerData = async(data : {
        customer_name: string;
        customer_phone: string;
        customer_address?: string;
        customer_pic_name?: string;
        customer_pic_contact?: string;
        customer_top?: number;
    }) => {
        try {
            setLoading(true);
            await createCustomer(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.customer.success_customer_create);
            setTimeout(() => setShowAlert(false), 8000);
            setIsCustomerOpen(false);
            init();
        } catch (err: any) {
            setIsCustomerOpen(false);
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(err.message || t.master.error_msg);
            setTimeout(() => setShowAlert(false), 8000);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCustomerDialog = () => {
        setIsCustomerOpen(true);
    };

    const handleUpdateCustomer = async(data : {
        customer_id: string;
        customer_name: string;
        customer_phone: string;
        customer_address: string;
        customer_pic_name: string;
        customer_pic_contact: string;
        customer_top: number;
    }) => {
        try {
            setLoading(true);
            await updateCustomer(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.customer.success_customer_update);
            setTimeout(() => setShowAlert(false), 8000);
            setIsCustomerOpen(false);
            init();
        } catch (err: any) {
            setIsCustomerOpen(false);
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(err.message || t.master.error_msg);
            setTimeout(() => setShowAlert(false), 8000);
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteCustomer = async({ customer_id }: { customer_id: string }) => {
        try {
            setLoading(true);
            await deleteCustomer(customer_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.customer.success_customer_delete);
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

    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>{t.customer.title}</Heading>

                    <Flex gap={2} alignItems={"center"}>
                        <InputGroup startElement={<LuSearch />}>
                            <Input placeholder={t.customer.search} bg={"white"} value={findCustomer} onChange={(e) => setFindCustomer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setCustomerPage(1);
                                        init();
                                    }
                                }}
                                width="250px"
                            />
                        </InputGroup>
                    
                    <Button bg="#E77A1F" color="white" onClick={handleOpenCustomerDialog}>
                        {t.customer.create_button}
                    </Button>
                </Flex>
            </Flex>        

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
            
            <CustomerDialog 
                isOpen={isCustomerOpen} 
                setIsOpen={(open) => {
                    setIsCustomerOpen(open);
                    if (!open) setEditingCustomer(null);
                }}
                title={editingCustomer ? t.customer.update_button : t.customer.create_button}
                placeholders={{customer_id: editingCustomer?.customer_id, customer_name: editingCustomer?.customer_name, customer_phone: editingCustomer?.customer_phone, customer_address: editingCustomer?.customer_address, customer_pic: editingCustomer?.customer_pic_name, customer_contact_pic: editingCustomer?.customer_pic_contact, customer_top: editingCustomer?.customer_top}}
                onSubmit={(data) => {
                    if(editingCustomer) {
                        handleUpdateCustomer({
                            customer_id: data.customer_id ?? editingCustomer.company_id,
                            customer_name: data.customer_name,
                            customer_phone: data.customer_phone,
                            customer_address: data.customer_address,
                            customer_pic_name: data.customer_pic,
                            customer_pic_contact: data.customer_contact_pic,
                            customer_top: data.customer_top
                        });
                    } else {
                        handleCreateCustomerData({
                            customer_name: data.customer_name,
                            customer_phone: data.customer_phone,
                            customer_address: data.customer_address,
                            customer_pic_name: data.customer_pic,
                            customer_pic_contact: data.customer_contact_pic,
                            customer_top: data.customer_top
                        })
                    }
                }}
            />

            <Table.Root  >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.customer.customer_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.customer.customer_address}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.customer.customer_phone}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {customerData?.map((customer) => (
                    <Table.Row key={customer.customer_id}>
                        <Table.Cell textAlign={"center"}>{customer.customer_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{customer.customer_address}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{customer.customer_phone}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            const detail = await getDetailCustomer(customer.customer_id);
                                            setEditingCustomer(detail.data?.[0] ?? null);
                                            setIsCustomerOpen(true);
                                        } finally {
                                            setLoading(false);
                                        }
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
                                                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteCustomer({ customer_id: customer.customer_id })}>{t.delete_popup.delete}</Button>
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
                <Pagination.Root count={customerPagination.total_pages}pageSize={1} page={customerPage} onPageChange={(details) => setCustomerPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton key={page.value} variant={page.value === customerPage ? "outline" : "ghost"} onClick={() => setCustomerPage(page.value)}>
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
    );
}