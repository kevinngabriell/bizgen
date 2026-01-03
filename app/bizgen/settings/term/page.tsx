"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, Flex, Heading, IconButton, Pagination, Table } from "@chakra-ui/react";
import { useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function SettingTerm(){
    const [loading, setLoading] = useState(false);
    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [termPage, setTermPage] = useState(1);
    const [termPagination, setTermagination] = useState({ total_pages: 1, page: 1 });
    const [findTerm, setFindTerm] = useState('');
    // const [termData, setTermData] = useState<Term[]>([]);
    
    return(
        <SidebarWithHeader username={"-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Term ERP Settings</Heading>
                <Button>Create New Term</Button>
            </Flex>            

            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Term</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>        
                {/* <Table.Body>
                    {termData?.map((term) => (
                    <Table.Row key={term.term_id}>
                        <Table.Cell textAlign={"center"}>{term.term_name}</Table.Cell>
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
                                                    <Button>Hapus</Button>
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
                </Table.Body>                         */}
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