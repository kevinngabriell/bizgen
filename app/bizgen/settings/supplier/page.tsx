"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import SupplierDialog from "./supplierdialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Loading from "@/components/loading";
import { getAllSupplier, GetSupplierData } from "@/lib/master/supplier";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiTrash } from "react-icons/fi";

export default function SettingSupplier(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSupplierOpen, setIsSupplierOpen] = useState(false);

    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierPagination, setSupplierPagination] = useState({ total_pages: 1, page: 1 });
    const [findSupplier, setFindSupplier] = useState('');
    const [supplierData, setSupplierData] = useState<GetSupplierData[]>([]);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<GetSupplierData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        init();
    }, [supplierPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);

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

    if (loading) return <Loading/>;
    
    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Supplier ERP Settings</Heading>
                <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create New Supplier</Button>
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

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
                
                <Table.Body>
                    {supplierData?.map((supplier) => (
                    <Table.Row key={supplier.supplier_id}>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_origin}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{supplier.supplier_currency}</Table.Cell>
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