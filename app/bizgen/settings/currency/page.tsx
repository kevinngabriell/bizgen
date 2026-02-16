"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import CurrencyDialog from "./currencydialog";
import Loading from "@/components/loading";
import { createCurrency, deleteCurrency, getAllCurrency, GetCurrencyData, updateCurrency } from "@/lib/master/currency";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";

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

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    useEffect(() => {
        init();
    }, [currencyPage]);

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
    
    const handleCreateCurrency  = async(data: { 
        currency_name: string;
        currency_code: string;
        currency_symbol: string; 
    }) => {
        try {
            setLoading(true);
            await createCurrency(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.currency.success_currency_create);
            setIsCurrencyOpen(false);
            init();
        } catch (err: any) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(err.message || t.master.error_msg);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCurrencyDialog = () => {
        setIsCurrencyOpen(true);
    };

    const handleUpdateCurrency  = async(data: {
        currency_id: string;
        currency_code: string;
        currency_symbol: string;
        currency_name: string;
    }) => {
        try {
            setLoading(true);
            await updateCurrency(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.currency.success_currency_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsCurrencyOpen(false);
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

    const handleDeleteCurrency = async({ currency_id }: { currency_id: string }) => {
        try {
            setLoading(true);
            await deleteCurrency(currency_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.currency.success_currency_delete);
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
                <Heading mb={6} width={"100%"}>{t.currency.title}</Heading>
                <Button onClick={handleOpenCurrencyDialog} bg={"#E77A1F"} color={"white"} cursor={"pointer"}>{t.currency.create_button}</Button>
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <CurrencyDialog isOpen={isCurrencyOpen} 
                setIsOpen={(open) => {
                    setIsCurrencyOpen(open);
                    if (!open) setEditingCurrency(null);
                }}
                title={editingCurrency ? t.currency.update_button : t.currency.create_button}
                placeholders={{ currency_id: editingCurrency?.currency_id, currency_name: editingCurrency?.currency_name, currency_code: editingCurrency?.currency_code, currency_symbol: editingCurrency?.currency_symbol}}
                onSubmit={(data) => {
                    if (editingCurrency) {
                        handleUpdateCurrency({
                            currency_id: data.currency_id ?? editingCurrency.currency_id,
                            currency_code: data.currency_code,
                            currency_name: data.currency_name,
                            currency_symbol: data.currency_symbol
                        });
                    } else {
                        handleCreateCurrency({
                            currency_code: data.currency_code,
                            currency_name: data.currency_name,
                            currency_symbol: data.currency_symbol
                        });
                    }
                }}
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.currency.currency_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.currency.currency_symbol}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
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
                                                    <Dialog.Title>{t.delete_popup.title}</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>{t.delete_popup.description}</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline" cursor={"pointer"}>{t.delete_popup.cancel}</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteCurrency({ currency_id: currency.currency_id })}>{t.delete_popup.delete}</Button>
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