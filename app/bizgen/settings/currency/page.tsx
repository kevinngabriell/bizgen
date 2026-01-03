"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import CurrencyDialog from "./currencydialog";

export default function SettingCurrency(){
    const [loading, setLoading] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [currencyPage, setCurrencyPage] = useState(1);
    const [currencyPagination, setCurrencyPagination] = useState({ total_pages: 1, page: 1 });
    const [findCurrency, setFindCurrency] = useState('');
    // const [currencyData, setCurrencyData] = useState<Currency[]>([]);

    const handleCreateCurrency  = async(data: { currency_name: string; }) => {

    };

    const handleOpenCurrencyDialog = () => {

    };

    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Currency ERP Settings</Heading>
                <Button onClick={handleOpenCurrencyDialog}>Create New Currency</Button>
            </Flex>

            {/* {showAlert && <AlertMessage title={errorTitle} description={errorMessage} isSuccess={isSuccess} />} */}

            <CurrencyDialog 
                isOpen={isCurrencyOpen} 
                setIsOpen={(open) => {
                    setIsCurrencyOpen(open);
                    // if (!open) setEditingCurrency(null);
                }}
                title={"Create Currency"}
                placeholders={{ currency_id: 'editingCurrency.currency_id', currency_name: 'editingCurrency.currency_name' }}
                onSubmit={(data) =>
                   handleCreateCurrency(data)
                }
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Currency</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {/* {currencyData?.map((currency) => (
                    <Table.Row key={currency.currency_id}>
                        <Table.Cell textAlign={"center"}>{currency.currency_name}</Table.Cell>
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
                                        <FiTrash />
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>Hapus Mata Uang</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus mara uang ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button onClick={() => handleDeleteCurrency({ currency_id: currency.currency_id })}>Hapus</Button>
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
                ))} */}
                </Table.Body>
            </Table.Root>
            
            <Flex display={"flex"} justify="flex-end" alignItems={"end"} width={"100%"} mt={"3"}>
                <Pagination.Root
                    count={currencyPagination.total_pages}pageSize={1} 
                    page={currencyPage} onPageChange={(details) => setCurrencyPage(details.page)}
                >
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