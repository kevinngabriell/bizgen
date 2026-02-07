"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import UOMDialog from "./uomDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Loading from "@/components/loading";
import { getAllUOM, UOMData } from "@/lib/master/uom";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiTrash } from "react-icons/fi";

export default function SettingUOM(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isUOMOpen, setIsUOMOpen] = useState(false);
    
    const [uomPage, setUOMPage] = useState(1);
    const [uomPagination, setUOMPagination] = useState({ total_pages: 1, page: 1 });
    const [findUOM, setFindUOM] = useState('');
    const [uomData, setUOMData] = useState<UOMData[]>([]);
    const [editingUOM, setEditingUOM] = useState('');   

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        init();
    }, [uomPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);

        try {
            const uomRes = await getAllUOM(uomPage, 10, findUOM);
            setUOMData(uomRes.data);
            setUOMPagination((prev) => ({
                ...prev,
                total_pages: uomRes.pagination?.total_pages || 1,
                page: uomPage,
            }));

        } catch (error: any){
            setUOMData([]);

        } finally {
            setLoading(false);
        }
    }
    
    if (loading) return <Loading/>;
    
    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>UOM ERP Settings</Heading>
                <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create New UOM</Button>
            </Flex>         

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <UOMDialog 
                isOpen={isUOMOpen} 
                setIsOpen={(open) => {
                    setIsUOMOpen(open);
                }}
                title={editingUOM ? "Update Shipment" : "Create Shipment"}
                placeholders={editingUOM ? undefined : undefined}
                onSubmit={(data) =>
                    editingUOM 
                }
                uomID={editingUOM}
            />            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Unit of Measurement</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Conversion Factor</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {uomData?.map((uom) => (
                    <Table.Row key={uom.uom_id}>
                        <Table.Cell textAlign={"center"}>{uom.uom_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{uom.conversion_factor}</Table.Cell>
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
                                                    <Dialog.Title>Hapus Data UOM</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus uom ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    {/* <Button onClick={() => handleDeleteUOM({ uom_id: uom.uomID })}>Hapus</Button> */}
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
                    count={uomPagination.total_pages}pageSize={1} 
                    page={uomPage} onPageChange={(details) => setUOMPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === uomPage ? "outline" : "ghost"} onClick={() => setUOMPage(page.value)}
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