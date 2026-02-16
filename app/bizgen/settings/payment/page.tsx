"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PaymentMethodDialog from "./paymentDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createPaymentMethod, deletePaymentMethod, getAllPaymentMethod, GetPaymentMethodData, updatePaymentMethod } from "@/lib/master/payment-method";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { FiEdit, FiTrash } from "react-icons/fi";
import { getLang } from "@/lib/i18n";
import { AlertMessage } from "@/components/ui/alert";

export default function SettingPayment(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentPagination, setPaymentPagination] = useState({ total_pages: 1, page: 1 });
    const [findPayment, setFindPayment] = useState('');
    const [paymentData, setPaymentData] = useState<GetPaymentMethodData[]>([]);
    const [editingPayment, setEditingPayment] = useState<GetPaymentMethodData | null>(null);
    
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    useEffect(() => {
        init();
    }, [paymentPage]);

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
            const paymentMethodRes = await getAllPaymentMethod(paymentPage, 10, findPayment);
            setPaymentData(paymentMethodRes.data);
            setPaymentPagination((prev) => ({
                ...prev,
                total_pages: paymentMethodRes.pagination?.total_pages || 1,
                page: paymentPage,
            }));

        } catch (error: any){
            setPaymentData([]);

        } finally {
            setLoading(false);
        }        
    }

    const handleCreatePaymentMethod = async (data: {
        payment_name: string;
    }) => {
        try {
            setLoading(true);
            await createPaymentMethod(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.payment_method.success_payment_method_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsPaymentOpen(false);
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

    const handleUpdatePaymentMethod  = async(data: {
        payment_id: string;
        payment_name: string;
    }) => {
        try {
            setLoading(true);
            await updatePaymentMethod(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.payment_method.success_payment_method_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsPaymentOpen(false);
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

    const handleOpenPaymentMethodDialog = () => {
        setIsPaymentOpen(true);
    };

    const handleDeletePaymentMethod = async({ payment_id }: { payment_id: string }) => {
        try {
            setLoading(true);
            await deletePaymentMethod(payment_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.payment_method.success_payment_method_delete);
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
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>{t.payment_method.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                    <Input placeholder={t.payment_method.search} bg={"white"} value={findPayment} onChange={(e) => setFindPayment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setPaymentPage(1);
                                init();
                            }
                        }} width="250px"
                    />
                    </InputGroup>
                <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenPaymentMethodDialog}>{t.payment_method.create_button}</Button>
            </Flex>
            </Flex>            

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <PaymentMethodDialog isOpen={isPaymentOpen} 
                setIsOpen={(open) => {
                    setIsPaymentOpen(open);
                    if (!open) setEditingPayment(null);
                }}
                title={editingPayment ? t.payment_method.update_button : t.payment_method.create_button}
                placeholders={editingPayment ? { payment_id: editingPayment.payment_id, payment_name: editingPayment.payment_name } : undefined}
                onSubmit={(data) => {
                    if (editingPayment) {
                        handleUpdatePaymentMethod({
                            payment_id: data.payment_id ?? editingPayment.payment_id,
                            payment_name: data.payment_name
                        });
                    } else {
                        handleCreatePaymentMethod({
                            payment_name: data.payment_name
                        });
                    }
                }}
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.payment_method.payment_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paymentData?.map((payment) => (
                    <Table.Row key={payment.payment_id}>
                        <Table.Cell textAlign={"center"}>{payment.payment_name}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingPayment(payment);
                                        setIsPaymentOpen(true);
                                    }}
                                />
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash color="red" />
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeletePaymentMethod({ payment_id: payment.payment_id })}>{t.delete_popup.delete}</Button>
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
                    count={paymentPagination.total_pages}pageSize={1} 
                    page={paymentPage} onPageChange={(details) => setPaymentPage(details.page)}
                >
                <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                    <Pagination.PrevTrigger asChild>
                        <IconButton><LuChevronLeft /></IconButton>
                    </Pagination.PrevTrigger>
            
                    <Pagination.Items
                        render={(page) => (
                            <IconButton
                                key={page.value}
                                variant={page.value === paymentPage ? "outline" : "ghost"} onClick={() => setPaymentPage(page.value)}
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

function async(DataTransfer: { new(): DataTransfer; prototype: DataTransfer; }) {
    throw new Error("Function not implemented.");
}
