"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table } from "@chakra-ui/react";
import CustomerDialog from "./customerdialog";
import { useState } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function SettingCustomer(){
    const [loading, setLoading] = useState(false);
    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [customerPage, setCustomerPage] = useState(1);
    const [customerPagination, setCustomerPagination] = useState({ total_pages: 1, page: 1 });
    const [findCustomer, setFindCustomer] = useState('');
    // const [customerData, setCustomerData] = useState<Customer[]>([]);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [editingCustomer, setEditingCustomer] = useState('');
    
    return(
        <SidebarWithHeader username={ "-"}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Customer ERP Settings</Heading>
                <Button>Create New Customer</Button>
            </Flex>        

            {/* {showAlert && <AlertMessage title={errorTitle} description={errorMessage} isSuccess={isSuccess} />} */}
            
            <CustomerDialog 
                isOpen={isCustomerOpen} 
                setIsOpen={(open) => {
                    setIsCustomerOpen(open);
                }}
                title={editingCustomer ? "Update Customer" : "Create Customer"}
                placeholders={editingCustomer ? undefined : undefined}
                onSubmit={(data) =>
                    editingCustomer 
                }
                customer_id={editingCustomer}
            />

            <Table.Root  >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Company Name</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Company Address</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Company Phone</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {/* {customerData?.map((customer) => (
                    <Table.Row key={customer.customer_id}>
                        <Table.Cell textAlign={"center"}>{customer.customer_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{customer.customer_address}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{customer.customer_phone}</Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingCustomer(customer.customer_id);
                                        setIsCustomerOpen(true);
                                    }}
                                />
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash />
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>Hapus Data Customer</Dialog.Title>
                                                </Dialog.Header>

                                                <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus data customer ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button onClick={() => handleDeleteCustomer({ customer_id: customer.customer_id })}>Hapus</Button>
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
                ))} */}
                </Table.Body>
            </Table.Root>    

            <Flex display={"flex"} justify="flex-end" alignItems={"end"} width={"100%"} mt={"3"}>
                <Pagination.Root
                    count={customerPagination.total_pages}pageSize={1} 
                    page={customerPage} onPageChange={(details) => setCustomerPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                        <Pagination.PrevTrigger asChild>
                            <IconButton><LuChevronLeft /></IconButton>
                        </Pagination.PrevTrigger>

                        <Pagination.Items
                            render={(page) => (
                                <IconButton
                                    key={page.value}
                                    variant={page.value === customerPage ? "outline" : "ghost"} onClick={() => setCustomerPage(page.value)}
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