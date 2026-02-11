"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import OriginDialog from "./originDialog";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import Loading from "@/components/loading";
import { createOrigin, deleteOrigin, getAllOrigin, GetOriginData, updateOrigin } from "@/lib/master/origin";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiEdit, FiTrash } from "react-icons/fi";
import { getLang } from "@/lib/i18n";

export default function SettingOrigin(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOriginOpen, setIsOriginOpen] = useState(false);

    const [originPage, setOriginPage] = useState(1);
    const [originPagination, setOriginPagination] = useState({ total_pages: 1, page: 1 });
    const [findOrigin, setFindOrigin] = useState('');
    const [originData, setOriginData] = useState<GetOriginData[]>([]);
    const [editingOrigin, setEditingOrigin] = useState<GetOriginData | null>(null);

    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const t = getLang("en"); 
    
    useEffect(() => {
        init();
    }, [originPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);        

        try {
            const originRes = await getAllOrigin(originPage, 10, findOrigin);
            setOriginData(originRes.data);
            setOriginPagination((prev) => ({
                ...prev,
                total_pages: originRes.pagination?.total_pages || 1,
                page: originPage,
            }));

        } catch (error: any){
            setOriginData([]);

        } finally {
            setLoading(false);
        }        
    }

    if (loading) return <Loading/>;

    const handleCreateOrigin  = async(data: { 
        origin_name: string;
        is_free_trade: number;
        region: string;
    }) => {

        try {
            setLoading(true);
            await createOrigin(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.origin.success_origin_create);
            setIsOriginOpen(false);
            init();
        } catch (err: any) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup(t.master.error);
            setMessagePopup(err.message || t.master.error_msg);
        } finally {
            setLoading(false);
        }

    };

    const handleOpenOriginDialog = () => {
        setIsOriginOpen(true);
    };

    const handleUpdateOrigin = async(data: {
        origin_id: string;
        origin_name: string;
        region: string;
        is_free_trade: number;
    }) => {
        try {
            setLoading(true);
            await updateOrigin(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.origin.success_origin_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsOriginOpen(false);
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

    const handleDeleteOrigin = async({ origin_id }: { origin_id: string }) => {
        try {
            setLoading(true);
            await deleteOrigin(origin_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.origin.success_origin_delete);
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

    if (!auth) {
        return <Loading />;
    }
    
    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>{t.origin.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.origin.search} bg={"white"} value={findOrigin}
                            onChange={(e) => setFindOrigin(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setOriginPage(1);
                                    init();
                                }
                            }}
                            width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenOriginDialog}>{t.origin.create_button}</Button>
                </Flex>
            </Flex>      

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
            
            <OriginDialog 
                isOpen={isOriginOpen} 
                setIsOpen={(open) => {
                    setIsOriginOpen(open);
                }}
                title={editingOrigin ? t.origin.update_button : t.origin.create_button}
                placeholders={{origin_id: editingOrigin?.origin_id, origin_name: editingOrigin?.origin_name, region: editingOrigin?.region, is_free_trade: editingOrigin?.is_free_trade}}
                onSubmit={(data) => {
                    if(editingOrigin){
                        handleUpdateOrigin({
                            origin_id: data.origin_id ?? editingOrigin.origin_id,
                            origin_name : data.origin_name,
                            region: data.region,
                            is_free_trade: data.is_free_trade
                        });
                    } else {
                        handleCreateOrigin({
                            origin_name : data.origin_name,
                            region: data.region,
                            is_free_trade: data.is_free_trade
                        });
                    }
                }}
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.origin.origin_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.origin.free_trade}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.origin.region}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {originData?.map((origin) => (
                    <Table.Row key={origin.origin_id}>
                        <Table.Cell textAlign={"center"}>{origin.origin_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{origin.is_free_trade === 1 ? "Iya" : "Tidak"}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{origin.region}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingOrigin(origin);
                                        setIsOriginOpen(true);
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
                                                    <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteOrigin({ origin_id: origin.origin_id })}>{t.delete_popup.delete}</Button>
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
                    count={originPagination.total_pages}pageSize={1} 
                    page={originPage} onPageChange={(details) => setOriginPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === originPage ? "outline" : "ghost"} onClick={() => setOriginPage(page.value)}
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