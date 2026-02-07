"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PaymentMethodDialog from "./paymentDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Loading from "@/components/loading";
import { getAllPaymentMethod, GetPaymentMethodData } from "@/lib/master/payment-method";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { FiTrash } from "react-icons/fi";

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

    useEffect(() => {
        init();
    }, [paymentPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);        

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

    if (loading) return <Loading/>;
    
    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Payment ERP Settings</Heading>
                <PaymentMethodDialog triggerIcon={<Button>Create New Payment</Button>} title="Penambahan Metode Pembayaran"/>
            </Flex>            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Payment</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {paymentData?.map((payment) => (
                    <Table.Row key={payment.payment_id}>
                        <Table.Cell textAlign={"center"}>{payment.payment_name}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash />
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>Hapus Kode Akun</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus term ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button>Hapus</Button>
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