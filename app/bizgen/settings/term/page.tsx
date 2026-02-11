"use client";

import Loading from "@/components/loading";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { createTerm, deleteTerm, getAllTerm, GetTermData, updateTerm } from "@/lib/master/term";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import TermDialog from "./termdialog";

export default function SettingTerm(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    const [isTermOpen, setIsTermOpen] = useState(false);
    
    const [termPage, setTermPage] = useState(1);
    const [termPagination, setTermPagination] = useState({ total_pages: 1, page: 1 });
    const [findTerm, setFindTerm] = useState('');
    const [termData, setTermData] = useState<GetTermData[]>([]);
    const [editingTerm, setEditingTerm] = useState<GetTermData | null>(null);
    
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const t = getLang("en"); 
    
    useEffect(() => {
        init();
    }, [termPage]);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;

        const info = getAuthInfo();
        setAuth(info);

        try {
            const termRes = await getAllTerm(termPage, 10, findTerm);
            setTermData(termRes.data);
            setTermPagination((prev) => ({
                ...prev,
                total_pages: termRes.pagination?.total_pages || 1,
                page: termPage,
            }));

        } catch (error: any){
            setTermData([]);

        } finally {
            setLoading(false);
        }
    }
    
    if (loading) return <Loading/>;

    const handleCreateTerm = async (data: {
        term_name: string;
    }) => {
        try {
            setLoading(true);
            await createTerm(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.term.success_term_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsTermOpen(false);
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

    const handleUpdateTerm  = async(data: {
        term_id: string;
        term_name:string;
    }) => {
        try {
            setLoading(true);
            await updateTerm(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.term.success_term_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsTermOpen(false);
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
    
    const handleOpenTermDialog = () => {
        setIsTermOpen(true);
    };

    const handleDeleteTerm = async({ term_id }: { term_id: string }) => {
        try {
            setLoading(true);
            await deleteTerm(term_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.term.success_term_delete);
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
                <Heading mb={6} width={"100%"}>{t.term.title}</Heading>
                <Flex gap={2} alignItems={"center"}>
                    <InputGroup startElement={<LuSearch />}>
                        <Input placeholder={t.term.search} bg={"white"} value={findTerm}
                            onChange={(e) => setFindTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setTermPage(1);
                                    init();
                                }
                            }}
                            width="250px"
                        />
                    </InputGroup>
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenTermDialog}>{t.term.create_button}</Button>
                </Flex>
            </Flex>            

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <TermDialog 
                isOpen={isTermOpen}
                setIsOpen={(open) => {
                    setIsTermOpen(open);
                    if (!open) setEditingTerm(null);
                }}
                title={editingTerm ? t.term.update_button : t.term.create_button}
                placeholders={editingTerm ? { 
                    term_id: editingTerm.term_id,
                    term_name: editingTerm.term_name
                } 
                : undefined}
                onSubmit={(data) => {
                    if(editingTerm){
                        handleUpdateTerm({
                            term_id: data.term_id ?? editingTerm.term_id,
                            term_name: data.term_name
                        });
                    } else {
                        handleCreateTerm({
                            term_name: data.term_name
                        });
                    }
                }}
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>{t.term.term_name}</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>        
                <Table.Body>
                    {termData?.map((term) => (
                    <Table.Row key={term.term_id}>
                        <Table.Cell textAlign={"center"}>{term.term_name}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingTerm(term);
                                        setIsTermOpen(true);
                                    }}
                                />
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash color="red" />
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
                                                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteTerm({ term_id: term.term_id })}>{t.delete_popup.delete}</Button>
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
                    count={termPagination.total_pages}pageSize={1} 
                    page={termPage} onPageChange={(details) => setTermPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === termPage ? "outline" : "ghost"} onClick={() => setTermPage(page.value)}
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