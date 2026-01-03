"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, Flex, Heading, IconButton, Pagination, Table } from "@chakra-ui/react";
import { useState } from "react";
import SupplierDialog from "./supplierdialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function SettingSupplier(){
    const [loading, setLoading] = useState(false);
    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierPagination, setSupplierPagination] = useState({ total_pages: 1, page: 1 });
    const [findSupplier, setFindSupplier] = useState('');
    // const [supplierData, setSupplierData] = useState<Supplier[]>([]);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    // const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    
    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Supplier ERP Settings</Heading>
                <Button>Create New Supplier</Button>
            </Flex>

            {/* {showAlert && <AlertMessage title={errorTitle} description={errorMessage} isSuccess={isSuccess} />} */}

            {/* <SupplierDialog 
                isOpen={isSupplierDialogOpen}
                setIsOpen={(open) => {
                    setIsSupplierDialogOpen(open);
                    if (!open) setEditingSupplier(null);
                }}
                title={editingSupplier ? "Update Supplier" : "Create Supplier"}
                placeholders={editingSupplier ? { 
                    namaSupplier: editingSupplier.supplier_name, 
                    nomorSupplier: editingSupplier.phone, 
                    alamatSupplier: editingSupplier.address,
                    asalSupplier: editingSupplier.origin_id,
                    picSupplier: editingSupplier.pic_name,
                    nomorpicSupplier: editingSupplier.pic_contact,
                    matauangSupplier: editingSupplier.currency_id,
                    termSupplier: editingSupplier.supplier_id,
                    informasibanSupplier: editingSupplier.bank_information
                } 
                : undefined}
                onSubmit={(data) => editingSupplier ? handleCreateSupplier(data) : handleCreateSupplier(data)}
            /> */}

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Name</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Origin</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Currency</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>  
                
                {/* <Table.Body>
                    {supplierData?.map((supplier) => (
                    <Table.Row key={supplier.supplier_id}>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{supplier.origin_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{supplier.currency_name}</Table.Cell>
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
                </Table.Body>                               */}
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