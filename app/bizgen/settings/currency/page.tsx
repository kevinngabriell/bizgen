"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import CurrencyDialog from "./currencydialog";
import Loading from "@/components/loading";
import { createCurrency, deleteCurrency, getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";

export default function SettingCurrency(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    
    const [findCurrency, setFindCurrency] = useState('');
    const [currencyData, setCurrencyData] = useState<GetCurrencyData[]>([]);
    const [currencyPagination, setCurrencyPagination] = useState({ total_pages: 1, page: 1 });
    const [currencyPage, setCurrencyPage] = useState(1);
    const [editingCurrency, setEditingCurrency] = useState<GetCurrencyData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        init();
    }, [currencyPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);

        try {
            const currencyRes = await getAllCurrency(currencyPage, 10, findCurrency);
            setCurrencyData(currencyRes.data);
            setCurrencyPagination((prev) => ({
                ...prev,
                total_pages: currencyRes.pagination?.total_pages || 1,
                page: currencyPage,
            }));

        } catch (error: any){
            setCurrencyData([]);

        } finally {
            setLoading(false);
        }
    }
    
    if (loading) return <Loading/>;
    
    const handleCreateCurrency  = async(data: { 
        currency_name: string;
        currency_code: string;
        currency_symbol: string; 
    }) => {
        
        if (!data.currency_code?.trim() || !data.currency_name?.trim() || !data.currency_symbol?.trim()) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup("Data tidak lengkap");
            setMessagePopup("Kode, nama, dan simbol mata uang wajib diisi");
            setTimeout(() => setShowAlert(false), 6000);
            return;
        }

        try {
            setLoading(true);
            await createCurrency(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup("Success");
            setMessagePopup("Mata uang berhasil ditambahkan");
            setIsCurrencyOpen(false);
            init();
        } catch (err: any) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup("Gagal");
            setMessagePopup(err.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCurrencyDialog = () => {
        setIsCurrencyOpen(true);
    };

    const handleUpdateCurrency = async() => {

    }

    const handleDeleteCurrency = async({ currency_id }: { currency_id: string }) => {
        try {
            setLoading(true);
            await deleteCurrency(currency_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup('Success');
            setMessagePopup('Data mata uang telah berhasil di hapus');
            setTimeout(() => setShowAlert(false), 8000);
            init();
        } catch (error : any){
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup('Gagal');
            setMessagePopup('Terdapat error dengan detail error : ' + error.message);
            setTimeout(() => setShowAlert(false), 8000);
            init();
        } finally {
            setLoading(false);
        }
    }

    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={2}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Currency ERP Settings</Heading>
                <Button onClick={handleOpenCurrencyDialog} bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create New Currency</Button>
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <CurrencyDialog isOpen={isCurrencyOpen} 
                setIsOpen={(open) => {
                    setIsCurrencyOpen(open);
                    if (!open) setEditingCurrency(null);
                }}
                title={editingCurrency ? "Update Currency" : "Create Currency"}
                placeholders={{ currency_id: editingCurrency?.currency_id, currency_name: editingCurrency?.currency_name, currency_code: editingCurrency?.currency_code, currency_symbol: editingCurrency?.currency_symbol}}
                onSubmit={(data) =>
                   editingCurrency ? handleUpdateCurrency() : handleCreateCurrency(data)
                }
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Currency Name</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Currency Symbol</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {currencyData?.map((currency) => (
                    <Table.Row key={currency.currency_id}>
                        <Table.Cell textAlign={"center"}>{currency.currency_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{currency.currency_symbol}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingCurrency(currency);
                                        setIsCurrencyOpen(true);
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
                                                    <Dialog.Title>Hapus Mata Uang</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus mata uang ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline" cursor={"pointer"}>Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteCurrency({ currency_id: currency.currency_id })}>Hapus</Button>
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
                <Pagination.Root count={currencyPagination.total_pages}pageSize={1} page={currencyPage} onPageChange={(details) => setCurrencyPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === currencyPage ? "outline" : "ghost"} onClick={() => setCurrencyPage(page.value)}
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
    );
}