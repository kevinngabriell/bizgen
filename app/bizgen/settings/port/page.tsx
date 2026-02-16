"use client";

import Loading from "@/components/loading";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { createPort, deletePort, getAllPort, GetPortData, updatePort, UpdatePortData } from "@/lib/master/port";
import { getAllSupplier } from "@/lib/master/supplier";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import PortDialog from "./portDialog";
import { FiEdit, FiTrash } from "react-icons/fi";

export default function SettingPort(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPortOpen, setIsPortOpen] = useState(false);

    const [portPage, setPortPage] = useState(1);
    const [portPagination, setPortPagination] = useState({ total_pages: 1, page: 1 });
    const [findPort, setFindPort] = useState('');
    const [portData, setPortData] = useState<GetPortData[]>([]);
    const [editingPort, setEditingPort] = useState<GetPortData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    useEffect(() => {
        init();
    }, [portPage]);

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
            const portRes = await getAllPort(portPage, 10, findPort);
            setPortData(portRes.data);
            setPortPagination((prev) => ({
                ...prev,
                total_pages: portRes.pagination?.total_pages || 1,
                page: portPage,
            }));

        } catch (error: any){
            setPortData([]);

        } finally {
            setLoading(false);
        }
    }    

    const handleCreatePort  = async(data: {
        port_name: string;
        origin_id: string;
    }) => {
        try {
            setLoading(true);
            await createPort(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.port.success_port_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsPortOpen(false);
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

    const handleUpdatePort = async (data: UpdatePortData) =>  {
        try {
            setLoading(true);
            await updatePort(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.port.success_port_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsPortOpen(false);
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
    
    const handleOpenPortDialog = () => {
        setIsPortOpen(true);
    };

    const handleDeletePort = async({ port_id }: { port_id: string }) => {
        try {
            setLoading(true);
            await deletePort(port_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.port.success_port_delete);
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
                <Heading mb={6} width={"100%"}>{t.port.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.port.search} bg={"white"} value={findPort}
                            onChange={(e) => setFindPort(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setPortPage(1);
                                    init();
                                }
                            }}
                            width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenPortDialog}>{t.port.create_button}</Button>
                </Flex>
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
            
            <PortDialog 
                isOpen={isPortOpen}
                setIsOpen={(open) => {
                    setIsPortOpen(open);
                    if (!open) setEditingPort(null);
                }}
                title={editingPort ? t.port.update_button : t.port.create_button}
                placeholders={editingPort ? { 
                    port_id: editingPort.port_id,
                    port_name: editingPort.port_name, 
                    origin_id: editingPort.origin_id
                } 
                : undefined}
                onSubmit={(data) => {
                    if(editingPort){
                        handleUpdatePort({
                            port_id: data.port_id ?? editingPort.port_id,
                            port_name: editingPort.port_name, 
                            origin_id: editingPort.origin_id
                        });
                    } else {
                        handleCreatePort({
                            port_name: data.port_name,
                            origin_id: data.origin_id
                        });
                    }
                }}
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.port.port_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.port.origin_country}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>  

                <Table.Body>
                    {portData?.map((port) => (
                    <Table.Row key={port.port_id}>
                        <Table.Cell textAlign={"center"}>{port.port_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{port.origin_name}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingPort(port);
                                        setIsPortOpen(true);
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeletePort({ port_id: port.port_id })}>{t.delete_popup.delete}</Button>
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
                <Pagination.Root count={portPagination.total_pages}pageSize={1} page={portPage} onPageChange={(details) => setPortPage(details.page)}>
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                    <Pagination.PrevTrigger asChild>
                        <IconButton>
                        <LuChevronLeft />
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.Items
                        render={(page) => (
                            <IconButton key={page.value} variant={page.value === portPage ? "outline" : "ghost"} onClick={() => setPortPage(page.value)}>{page.value} </IconButton>
                        )}
                    />

                    <Pagination.NextTrigger asChild>
                        <IconButton>
                        <LuChevronRight />
                        </IconButton>
                    </Pagination.NextTrigger>
                    </ButtonGroup>
                </Pagination.Root>

            </Flex>          

        </SidebarWithHeader>
    );

}