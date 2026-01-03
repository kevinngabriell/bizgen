"use client";

import UpgradeRequiredDialog from "@/components/dialog/UpgradeRequiredDialog";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Pagination, Portal, Table, Tabs } from "@chakra-ui/react";
import { useState } from "react";
import { FiTrash, FiEdit } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import AccountCodeDialog from "./accountcodedialog";
import BankAccountDialog from "./bankaccountdialog";

export default function SettingFinance(){
    const [loading, setLoading] = useState(false);
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [accountCodePagination, setAccountCodePagination] = useState({ total_pages: 1, page: 1 });
    const [accountCodePage, setAccountCodePage] = useState(1);
    const [bankAccountPage, setBankAccountPage] = useState(1);
    const [bankAccountPagination, setBankAccountPagination] = useState({ total_pages: 1, page: 1 });
    const [findAccountCode, setFindAccountCode] = useState('');
    const [findBankAccount, setFindBankAccount] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    return(
        <SidebarWithHeader username={"-"}>
            <Heading mb={6}>Finance ERP Settings</Heading>

            {/* {showAlert && <AlertMessage title={errorTitle} description={errorMessage} isSuccess={isSuccess} />} */}

            <Tabs.Root defaultValue="bank-account">
                <Tabs.List>
                    <Tabs.Trigger value="bank-account">Bank Account</Tabs.Trigger>
                    <Tabs.Trigger value="account-code">Account Code</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="bank-account">

                    <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                        <Heading mb={6} width={"100%"}>Bank Account List</Heading>
                        <Button>Create New Bank Account</Button>
                    </Flex>           

                    {/* <BankAccountDialog 
                        isOpen={isBankDialogOpen}
                        setIsOpen={(open) => {
                            setIsBankDialogOpen(open);
                            if (!open) setEditingBank(null);
                        }}
                        title={editingBank ? "Update Bank Account" : "Create Bank Account"}
                        placeholders={editingBank ? { nomorRekening: editingBank.bank_number, bank: editingBank.bank_name, cabang: editingBank.bank_branch } : undefined}
                        onSubmit={(data) => editingBank ? handleSubmitNewBankAccount(data) : handleSubmitNewBankAccount(data)}
                    /> */}

                    <Table.Root showColumnBorder variant="outline" background={"white"}>
                        <Table.Header>
                            <Table.Row bg="bg.subtle">
                                <Table.ColumnHeader textAlign={"center"}>Bank Number</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Bank Branch</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Bank Name</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Currency</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>   
                        <Table.Body>
                            {/* {bankAccountData?.map((bank) => (
                            <Table.Row key={bank.bank_number}>
                                <Table.Cell textAlign={"center"}>{bank.bank_number}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{bank.bank_branch}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{bank.bank_name}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{bank.currency_name}</Table.Cell>
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
                                                            <Dialog.Title>Hapus Rekening Bank</Dialog.Title>
                                                        </Dialog.Header>

                                                        <Dialog.Body>
                                                            <Text>Apakah anda yakin ingin menghapus rekening bank ini ?</Text>
                                                        </Dialog.Body>

                                                        <Dialog.Footer>
                                                            <Dialog.ActionTrigger asChild>
                                                                <Button variant="outline">Batal</Button>
                                                            </Dialog.ActionTrigger>
                                                            <Button onClick={() => handleDeleteBankAccount({ banknumber: bank.bank_number })}>Hapus</Button>
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
                        <Pagination.Root count={bankAccountPagination.total_pages} pageSize={1} page={bankAccountPage} onPageChange={(details) => setBankAccountPage(details.page)}>
                            <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                                <Pagination.PrevTrigger asChild>
                                    <IconButton> <LuChevronLeft/> </IconButton>
                                </Pagination.PrevTrigger>
                                <Pagination.Items
                                    render={(page) => (
                                        <IconButton key={page.value} variant={page.value === bankAccountPage ? "outline" : "ghost"} onClick={() => setBankAccountPage(page.value)}>
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

                </Tabs.Content>
                <Tabs.Content value="account-code">
                    
                    <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                        <Heading mb={6} width={"100%"}>Account Code List</Heading>
                        <Button>Create New Account Code</Button>
                    </Flex>

                    {/* <AccountCodeDialog
                        isOpen={isAccountDialogOpen}
                        setIsOpen={(open) => {
                            setIsAccountDialogOpen(open);
                            if (!open) setEditingAccount(null);
                        }}
                        title={editingAccount ? "Update Kode Akun" : "Create Kode Akun"}
                        placeholders={
                            editingAccount
                            ? {
                                kodeAkun: editingAccount.code,
                                namaAkun: editingAccount.account_name,
                                aliasAkun: editingAccount.account_name_alias,
                                }
                            : undefined
                        }
                        onSubmit={(data) =>
                            editingAccount ? handleUpdateAccountCode(data) : handleSubmitNewAccountCode(data)
                        }
                    /> */}

                    <UpgradeRequiredDialog
                        isOpen={showUpgradeDialog}
                        onClose={() => setShowUpgradeDialog(false)}
                        currentPackage={""}
                        allowedPackages={["Advanced", "Enterprise"]}
                    />

                    <Table.Root showColumnBorder variant="outline" background={"white"}>
                        <Table.Header>
                            <Table.Row bg="bg.subtle">
                                <Table.ColumnHeader textAlign={"center"}>Code</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Account Name</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Account Name Alias</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>   
                        {/* <Table.Body>
                            {accountCodeData?.map((account) => (
                            <Table.Row key={account.id}>
                                <Table.Cell textAlign={"center"}>{account.code}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{account.account_name}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{account.account_name_alias}</Table.Cell>
                                <Table.Cell textAlign="center">
                                    <Flex justify="center" gap={4} fontSize={"2xl"}>
                                        <FiEdit
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                            setEditingAccount(account);
                                            setIsAccountDialogOpen(true);
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
                                                            <Dialog.Title>Hapus Kode Akun</Dialog.Title>
                                                        </Dialog.Header>

                                                        <Dialog.Body>
                                                            <Text>Apakah anda yakin ingin menghapus kode akun ini ?</Text>
                                                        </Dialog.Body>

                                                        <Dialog.Footer>
                                                            <Dialog.ActionTrigger asChild>
                                                                <Button variant="outline">Batal</Button>
                                                            </Dialog.ActionTrigger>
                                                            <Button onClick={() => handleDeleteAccountCode({ accountcode: account.code })}>Hapus</Button>
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
                        </Table.Body>                                                */}
                    </Table.Root>

                    <Flex display={"flex"} justify="flex-end" alignItems={"end"} width={"100%"} mt={"3"}>
                        <Pagination.Root
                            count={accountCodePagination.total_pages}
                            pageSize={1} // karena total_pages udah hitungan per page
                            page={accountCodePage}
                            onPageChange={(details) => setAccountCodePage(details.page)}
                            >
                            <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                                <Pagination.PrevTrigger asChild>
                                <IconButton><LuChevronLeft /></IconButton>
                                </Pagination.PrevTrigger>

                                <Pagination.Items
                                render={(page) => (
                                    <IconButton
                                    key={page.value}
                                    variant={page.value === accountCodePage ? "outline" : "ghost"}
                                    onClick={() => setAccountCodePage(page.value)}
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

                </Tabs.Content>
            </Tabs.Root>
        </SidebarWithHeader>
        // settings

    );
}