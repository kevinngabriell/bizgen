"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, Flex, Heading, IconButton, Pagination, Table } from "@chakra-ui/react";
import { useState } from "react";
import OriginDialog from "./originDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function SettingOrigin(){
    const [loading, setLoading] = useState(false);
    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [originPage, setOriginPage] = useState(1);
    const [originPagination, setOriginPagination] = useState({ total_pages: 1, page: 1 });
    const [findOrigin, setFindOrigin] = useState('');
    // const [originData, setOriginData] = useState<Origin[]>([]);
    const [isOriginOpen, setIsOriginOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [editingOrigin, setEditingOrigin] = useState('');
    
    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Origin ERP Settings</Heading>
                <Button>Create New Origin</Button>
            </Flex>      

            {/* {showAlert && <AlertMessage title={errorTitle} description={errorMessage} isSuccess={isSuccess} />} */}
            
            <OriginDialog 
                isOpen={isOriginOpen} 
                setIsOpen={(open) => {
                    setIsOriginOpen(open);
                }}
                title={editingOrigin ? "Update Origin" : "Create Origin"}
                placeholders={editingOrigin ? undefined : undefined}
                onSubmit={(data) =>
                    editingOrigin
                }
                origin_id={editingOrigin}
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
                {/* <Table.Body>
                    {originData?.map((origin) => (
                    <Table.Row key={origin.origin_id}>
                        <Table.Cell textAlign={"center"}>{origin.origin_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{origin.origin_is_free_trade === "1" ? "Iya" : "Tidak"}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{origin.region}</Table.Cell>
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
                                                    <Dialog.Title>Hapus Kode Akun</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus term ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button onClick={() => handleDeleteOrigin({ originID: origin.origin_id })}>Hapus</Button>
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
                </Table.Body> */}
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