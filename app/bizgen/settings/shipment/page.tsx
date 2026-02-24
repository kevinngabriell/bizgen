"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ShipmentDialog from "./shipmentDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createShipmentPeriod, deleteShipmentPeriod, getAllShipmentPeriod, GetShipmentPeriodData, updateShipmentPeriod } from "@/lib/master/shipment-period";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { FiEdit, FiTrash } from "react-icons/fi";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";

export default function SettingShipment(){
    //authentication & loading variable
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    //related to shipment variable
    const [isShipmentOpen, setIsShipmentOpen] = useState(false);
    const [shipmentPage, setShipmentPage] = useState(1);
    const [shipmentPagination, setShipmentPagination] = useState({ total_pages: 1, page: 1 });
    const [findShipment, setFindShipment] = useState('');
    const [shipmentData, setShipmentData] = useState<GetShipmentPeriodData[]>([]);
    const [editingShipment, setEditingShipment] = useState<GetShipmentPeriodData | null>(null);

    //alert & success variable
    const [showAlert, setShowAlert] = useState(false);  
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);
    
    useEffect(() => {
        init();
    }, [shipmentPage]);

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

    const handleCreateShipmentPeriod = async (data: {
        shipment_period_name: string;
        shipment_date_range_start: string;
        shipment_date_range_end: string;
    }) => {
        try {
            setLoading(true);
            await createShipmentPeriod(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.shipment_period.success_shipment_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsShipmentOpen(false);
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

    const handleUpdateShipmentPeriod  = async(data: {
        shipment_period_id: string;
        shipment_period_name: string;
        shipment_date_range_start: string;
        shipment_date_range_end: string;
    }) => {
        try {
            setLoading(true);
            await updateShipmentPeriod(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.shipment_period.success_shipment_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsShipmentOpen(false);
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

    const handleOpenShipmentPeriodDialog = () => {
        setIsShipmentOpen(true);
    };

    const handleDeleteShipmentPeriod = async({ shipment_period_id }: { shipment_period_id: string }) => {
        try {
            setLoading(true);
            await deleteShipmentPeriod(shipment_period_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.shipment_period.success_shipment_delete);
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
                <Heading mb={6} width={"100%"}>{t.shipment_period.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.shipment_period.search} bg={"white"} value={findShipment} onChange={(e) => setFindShipment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setShipmentPage(1);
                                    init();
                                }
                            }} width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenShipmentPeriodDialog}>{t.shipment_period.create_button}</Button>
                </Flex>
            </Flex>         

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <ShipmentDialog isOpen={isShipmentOpen} title={editingShipment ? t.shipment_period.update_button : t.shipment_period.create_button}
                setIsOpen={(open) => {
                    setIsShipmentOpen(open);
                    if (!open) setEditingShipment(null);
                }}
                placeholders={editingShipment ? {shipment_period_id: editingShipment.shipment_period_id, shipment_period_name: editingShipment.shipment_period_name, shipment_date_range_start: editingShipment.shipment_date_range_start, shipment_date_range_end: editingShipment.shipment_date_range_end} : undefined}
                onSubmit={(data) =>{
                    if (editingShipment) {
                        handleUpdateShipmentPeriod({
                            shipment_period_id: data.shipment_period_id ?? editingShipment.shipment_period_id,
                            shipment_period_name: data.shipment_period_name,
                            shipment_date_range_start: data.shipment_date_range_start,
                            shipment_date_range_end: data.shipment_date_range_end
                        });
                    } else {
                        handleCreateShipmentPeriod({
                            shipment_period_name: data.shipment_period_name,
                            shipment_date_range_start: data.shipment_date_range_start,
                            shipment_date_range_end: data.shipment_date_range_end
                        });
                    }
                }}
            />            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.shipment_period.shipment_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {shipmentData?.map((shipment) => (
                    <Table.Row key={shipment.shipment_period_id}>
                        <Table.Cell textAlign={"center"}>{shipment.shipment_period_name}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingShipment(shipment);
                                        setIsShipmentOpen(true);
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
                                                        <Button variant="outline">{t.delete_popup.cancel}</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteShipmentPeriod({ shipment_period_id: shipment.shipment_period_id })}>Hapus</Button>
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
                <Pagination.Root count={shipmentPagination.total_pages}pageSize={1} page={shipmentPage} onPageChange={(details) => setShipmentPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items render={(page) => (
                                <IconButton key={page.value} variant={page.value === shipmentPage ? "outline" : "ghost"} onClick={() => setShipmentPage(page.value)}>
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