"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import UOMDialog from "./uomDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createUOM, deleteUOM, getAllUOM, UOMData, updateUOM } from "@/lib/master/uom";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiEdit, FiTrash } from "react-icons/fi";
import { getLang } from "@/lib/i18n";

export default function SettingUOM(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isUOMOpen, setIsUOMOpen] = useState(false);
    
    const [uomPage, setUOMPage] = useState(1);
    const [uomPagination, setUOMPagination] = useState({ total_pages: 1, page: 1 });
    const [findUOM, setFindUOM] = useState('');
    const [uomData, setUOMData] = useState<UOMData[]>([]);
    const [editingUOM, setEditingUOM] =  useState<UOMData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const t = getLang("en"); 

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

    const handleCreateUOM = async (data: {
        uom_name: string;
        conversion_factor: number;
    }) => {
        try {
            setLoading(true);
            await createUOM(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.uom.success_uom_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsUOMOpen(false);
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

    const handleUpdateUOM  = async(data: {
        uom_id: string;
        uom_name: string;
        conversion_factor: number;
    }) => {
        try {
            setLoading(true);
            await updateUOM(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.uom.success_uom_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsUOMOpen(false);
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

    const handleOpenUOMDialog = () => {
        setIsUOMOpen(true);
    };

    const handleDeleteUOM= async({ uom_id }: { uom_id: string }) => {
        try {
            setLoading(true);
            await deleteUOM(uom_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.uom.success_uom_delete);
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
    
    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>{t.uom.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.uom.search} bg={"white"} value={findUOM}
                            onChange={(e) => setFindUOM(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setUOMPage(1);
                                    init();
                                }
                            }}
                            width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenUOMDialog}>{t.uom.create_button}</Button>
                </Flex>
            </Flex>         

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <UOMDialog 
                isOpen={isUOMOpen} 
                setIsOpen={(open) => {
                    setIsUOMOpen(open);
                }}
                title={editingUOM ? t.uom.update_button : t.uom.create_button}
                placeholders={editingUOM ? {uom_id: editingUOM.uom_id, uom_name: editingUOM.uom_name, conversion_factor: editingUOM.conversion_factor} : undefined}
                onSubmit={(data) => {
                    if(editingUOM) { 
                        handleUpdateUOM({
                            uom_id: data.uom_id ?? editingUOM.uom_id,
                            uom_name: data.uom_name,
                            conversion_factor: data.conversion_factor
                        })
                    } else {
                        handleCreateUOM({
                            uom_name: data.uom_name,
                            conversion_factor: data.conversion_factor
                        })
                    }
                }}
            />            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.uom.uom_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.uom.conversion_factor}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {uomData?.map((uom) => (
                    <Table.Row key={uom.uom_id}>
                        <Table.Cell textAlign={"center"}>{uom.uom_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{uom.conversion_factor}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingUOM(uom);
                                        setIsUOMOpen(true);
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"}  onClick={() => handleDeleteUOM({ uom_id: uom.uom_id })}>{t.delete_popup.delete}</Button>
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