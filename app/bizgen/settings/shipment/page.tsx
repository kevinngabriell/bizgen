"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ShipmentDialog from "./shipmentDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Loading from "@/components/loading";
import { getAllShipmentPeriod, GetShipmentPeriodData } from "@/lib/master/shipment-period";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { FiTrash } from "react-icons/fi";
import { AlertMessage } from "@/components/ui/alert";

export default function SettingShipment(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isShipmentOpen, setIsShipmentOpen] = useState(false);
    
    const [shipmentPage, setShipmentPage] = useState(1);
    const [shipmentPagination, setShipmentPagination] = useState({ total_pages: 1, page: 1 });
    const [findShipment, setFindShipment] = useState('');
    const [shipmentData, setShipmentData] = useState<GetShipmentPeriodData[]>([]);
    const [editingShipment, setEditingShipment] = useState<GetShipmentPeriodData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    
    useEffect(() => {
        init();
    }, [shipmentPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);

        try {
            const shipmentRes = await getAllShipmentPeriod(shipmentPage, 10, findShipment);
            setShipmentData(shipmentRes.data);
            setShipmentPagination((prev) => ({
                ...prev,
                total_pages: shipmentRes.pagination?.total_pages || 1,
                page: shipmentPage,
            }));

        } catch (error: any){
            setShipmentData([]);

        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loading/>;
    
    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Shipment ERP Settings</Heading>
                <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create New Shipment</Button>
            </Flex>         

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <ShipmentDialog 
                isOpen={isShipmentOpen} 
                setIsOpen={(open) => {
                    setIsShipmentOpen(open);
                }}
                title={editingShipment ? "Update Shipment" : "Create Shipment"}
                placeholders={editingShipment ? undefined : undefined}
                onSubmit={(data) =>
                    editingShipment 
                }
            />            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Shipment Period</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {shipmentData?.map((shipment) => (
                    <Table.Row key={shipment.shipment_period_id}>
                        <Table.Cell textAlign={"center"}>{shipment.shipment_period_name}</Table.Cell>
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
                                                    <Dialog.Title>Hapus Data Shipment</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus shipment ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    {/* <Button onClick={() => handleDeleteShipment({ shipment_id: shipment.shipment_id })}>Hapus</Button> */}
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
                    count={shipmentPagination.total_pages}pageSize={1} 
                    page={shipmentPage} onPageChange={(details) => setShipmentPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === shipmentPage ? "outline" : "ghost"} onClick={() => setShipmentPage(page.value)}
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