"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import OriginDialog from "./originDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Loading from "@/components/loading";
import { createOrigin, deleteOrigin, getAllOrigin, GetOriginData } from "@/lib/master/origin";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { FiTrash } from "react-icons/fi";

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
            setTitlePopup("Success");
            setMessagePopup("Data origin berhasil ditambahkan");
            setIsOriginOpen(false);
            init();
        } catch (err: any) {
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup("Gagal");
            setMessagePopup(err.message || "Terjadi kesalahan");
        } finally {
            setLoading(false);
        }

    };

    const handleOpenOriginDialog = () => {
        setIsOriginOpen(true);
    };

    const handleUpdateOrigin = async() => {

    }

    const handleDeleteOrigin = async({ origin_id }: { origin_id: string }) => {
        try {
            setLoading(true);
            await deleteOrigin(origin_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup('Success');
            setMessagePopup('Data origin telah berhasil di hapus');
            setTimeout(() => setShowAlert(false), 8000);
            init();
        } catch (error : any){
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup('Gagal');
            setMessagePopup('Terdapat error dengan detail error : ' + error.message);
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
                <Heading mb={6} width={"100%"}>Origin ERP Settings</Heading>
                <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenOriginDialog}>Create New Origin</Button>
            </Flex>      

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
            
            <OriginDialog 
                isOpen={isOriginOpen} 
                setIsOpen={(open) => {
                    setIsOriginOpen(open);
                }}
                title={editingOrigin ? "Update Origin" : "Create Origin"}
                placeholders={{origin_id: editingOrigin?.origin_id, origin_name: editingOrigin?.origin_name, region: editingOrigin?.region, is_free_trade: editingOrigin?.is_free_trade}}
                onSubmit={(data) =>
                    editingOrigin ? handleUpdateOrigin() : handleCreateOrigin(data)
                }
            />

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Country</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Free Trade Area</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Region</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
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
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash color="red"/>
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
                                                    {/* <Button onClick={() => handleDeleteOrigin({ originID: origin.origin_id })}>Hapus</Button> */}
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