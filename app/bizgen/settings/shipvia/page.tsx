"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ShipViaDialog from "./shipviaDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createShipVia, deleteShipVia, getAllShipVia, GetShipViaData, updateShipVia } from "@/lib/master/ship-via";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiEdit, FiTrash } from "react-icons/fi";
import { getLang } from "@/lib/i18n";

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

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);
     
    useEffect(() => {
        init();
    }, [shipViaPage]);

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

    const handleCreateShipVia = async (data: {
        ship_via_name: string;
    }) => {
        try {
            setLoading(true);
            await createShipVia(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.ship_via.success_ship_via_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsShipViaOpen(false);
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

    const handleUpdateShipVia  = async(data: {
        ship_via_id: string;
        ship_via_name: string;
    }) => {
        try {
            setLoading(true);
            await updateShipVia(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.ship_via.success_ship_via_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsShipViaOpen(false);
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

    const handleOpenShipViaDialog = () => {
        setIsShipViaOpen(true);
    };

    const handleDeleteShipVia= async({ ship_via_id }: { ship_via_id: string }) => {
        try {
            setLoading(true);
            await deleteShipVia(ship_via_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.ship_via.success_ship_via_delete);
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
                <Heading mb={6} width={"100%"}>{t.ship_via.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.ship_via.search} bg={"white"} value={findShipVia} onChange={(e) => setFindShipVia(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    SetShipViaPage(1);
                                    init();
                                }
                            }} width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenShipViaDialog}>{t.ship_via.create_button}</Button>
                </Flex>
            </Flex>         

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <ShipViaDialog 
                isOpen={isShipViaOpen} 
                setIsOpen={(open) => {
                    setIsShipViaOpen(open);
                    if (!open) setEditingShipVia(null);
                }}
                title={editingShipVia ? t.ship_via.update_button : t.ship_via.create_button}
                placeholders={editingShipVia ? {ship_via_id: editingShipVia.ship_via_id, ship_via_name: editingShipVia.ship_via_name} : undefined}
                onSubmit={(data) => {
                    if(editingShipVia) {
                        handleUpdateShipVia({
                            ship_via_id: data.ship_via_id ?? editingShipVia.ship_via_id,
                            ship_via_name: data.ship_via_name
                        })
                    } else {
                        handleCreateShipVia({
                            ship_via_name: data.ship_via_name
                        })
                    }
                }}
            />            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.ship_via.ship_via_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {shipViaData?.map((shipvia) => (
                    <Table.Row key={shipvia.ship_via_id}>
                        <Table.Cell textAlign={"center"}>{shipvia.ship_via_name}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingShipVia(shipvia);
                                        setIsShipViaOpen(true);
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"}  onClick={() => handleDeleteShipVia({ ship_via_id: shipvia.ship_via_id })}>{t.delete_popup.delete}</Button>
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
                <Pagination.Root count={shipViaPagination.total_pages}pageSize={1} page={shipViaPage} onPageChange={(details) => SetShipViaPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items render={(page) => (
                                <IconButton key={page.value} variant={page.value === shipViaPage ? "outline" : "ghost"} onClick={() => SetShipViaPage(page.value)}>
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