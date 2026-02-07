"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ShipViaDialog from "./shipviaDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Loading from "@/components/loading";
import { getAllShipVia, GetShipViaData } from "@/lib/master/ship-via";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiTrash } from "react-icons/fi";

export default function SettingShipVia(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isShipViaOpen, setIsShipViaOpen] = useState(false);
    
    const [shipViaPage, SetShipViaPage] = useState(1);
    const [shipViaPagination, setShipViaPagination] = useState({ total_pages: 1, page: 1 });
    const [findShipVia, setFindShipVia] = useState('');
    const [shipViaData, setShipViaData] = useState<GetShipViaData[]>([]);
    const [editingShipVia, setEditingShipVia] = useState<GetShipViaData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
     
    useEffect(() => {
        init();
    }, [shipViaPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);

        try {
            const shipViaRes = await getAllShipVia(shipViaPage, 10, findShipVia);
            setShipViaData(shipViaRes.data);
            setShipViaPagination((prev) => ({
                ...prev,
                total_pages: shipViaRes.pagination?.total_pages || 1,
                page: shipViaPage,
            }));

        } catch (error: any){
            setShipViaData([]);

        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loading/>;
    
    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Ship Via ERP Settings</Heading>
                <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create New Ship Via</Button>
            </Flex>         

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <ShipViaDialog 
                isOpen={isShipViaOpen} 
                setIsOpen={(open) => {
                    setIsShipViaOpen(open);
                }}
                title={editingShipVia ? "Update Ship Via" : "Create Ship Via"}
                placeholders={editingShipVia ? undefined : undefined}
                onSubmit={(data) =>
                    editingShipVia
                }
            />            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Ship Via</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {shipViaData?.map((shipvia) => (
                    <Table.Row key={shipvia.ship_via_id}>
                        <Table.Cell textAlign={"center"}>{shipvia.ship_via_name}</Table.Cell>
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
                                                    <Dialog.Title>Hapus Ship Via</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus ship via ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    {/* <Button onClick={() => handleDeleteShipVia({ shipID: shipvia.shipID })}>Hapus</Button> */}
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
                    count={shipViaPagination.total_pages}pageSize={1} 
                    page={shipViaPage} onPageChange={(details) => SetShipViaPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === shipViaPage ? "outline" : "ghost"} onClick={() => SetShipViaPage(page.value)}
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