"use client";

import UpgradeRequiredDialog from "@/components/dialog/UpgradeRequiredDialog";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, CloseButton, Dialog, Flex, Heading, IconButton, Input, InputGroup, Pagination, Portal, Table, Tabs, Text } from "@chakra-ui/react";
import { useDebugValue, useEffect, useState } from "react";
import { FiTrash, FiEdit } from "react-icons/fi";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import AccountCodeDialog from "./accountcodedialog";
import BankAccountDialog from "./bankaccountdialog";
import Loading from "@/components/loading";
import { createAccountCode, deleteAccountCode, GetAccountCodeData, getAllAccountCode, updateAccountCode } from "@/lib/master/account-code";
import { createBankAccount, deleteBankAccount, getAllBankAccount, GetBankAccountData, updateBankAccount } from "@/lib/master/bank-account";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";

export default function SettingFinance(){
    const [loading, setLoading] = useState(false);
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);

    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [accountCodePagination, setAccountCodePagination] = useState({ total_pages: 1, page: 1 });
    const [accountCodePage, setAccountCodePage] = useState(1);
    const [findAccountCode, setFindAccountCode] = useState('');
    const [accountCodeData, setAccountCodeData] = useState<GetAccountCodeData[]>([]);
    const [editingAccountCode, setEditingAccountCode] = useState<GetAccountCodeData | null>(null);

    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [bankAccountPage, setBankAccountPage] = useState(1);
    const [bankAccountPagination, setBankAccountPagination] = useState({ total_pages: 1, page: 1 });
    const [findBankAccount, setFindBankAccount] = useState('');
    const [bankAccountData, setBankAccountData] = useState<GetBankAccountData[]>([]);
    const [editingBankAccount, setEditingBankAccount] = useState<GetBankAccountData | null>(null);

    const t = getLang("en"); 

    const handleOpenBankAccountDialog = () => {
        setIsBankDialogOpen(true);
    };

    const handleOpenAccountCodeDialog = () => {
        setIsAccountDialogOpen(true);
    }
    
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const [activeTab, setActiveTab] = useState<"bank-account" | "account-code">("bank-account");

    useEffect(() => {
        init();
    }, [accountCodePage, bankAccountPage]);

    const init = async () => {
        setLoading(true);
                
        const valid = await checkAuthOrRedirect();
        if(!valid) return;
                
        const info = getAuthInfo();
        setAuth(info);

        try {
            const accountCodeRes = await getAllAccountCode(accountCodePage, 10, findAccountCode);
            setAccountCodeData(accountCodeRes.data);
            setAccountCodePagination((prev) => ({
                ...prev,
                total_pages: accountCodeRes.pagination?.total_pages || 1,
                page: accountCodePage,
            }));

            const bankAccountRes = await getAllBankAccount(bankAccountPage, 10, findBankAccount);
            setBankAccountData(bankAccountRes.data);
            setBankAccountPagination((prev) => ({
                ...prev,
                total_pages: bankAccountRes.pagination?.total_pages || 1,
                page: bankAccountPage,
            }));
        } catch (error: any){
            setAccountCodeData([]);
            setBankAccountData([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loading/>;

    const handleCreateBankAccount =async(data: {
        bank_number: string;
        bank_name: string;
        currency_id: string;
        bank_branch: string;
        is_primary: boolean;
    }) => {
        try {
            setLoading(true);
            await createBankAccount(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.bank_account.success_bank_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsBankDialogOpen(false);
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

    const handleUpdateBankAccount = async (data: {
        bank_account_id: string;
        bank_name: string;
        currency_id: string;
        bank_branch: string;
        is_primary: boolean;
    }) => {
        try {
            setLoading(true);
            await updateBankAccount(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.bank_account.success_bank_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsBankDialogOpen(false);
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

    const handleDeleteBankAccount = async({ bank_account_id }: { bank_account_id: string }) => {
        try {
            setLoading(true);
            await deleteBankAccount(bank_account_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.bank_account.success_bank_delete);
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
    };

    const handleCreateAccountCode = async (data: {
        account_code: string;
        account_code_name: string;
        account_code_name_alias: string;
        account_type: string;
        parent_account_code_id: string; 
    }) => {
        try {
            setLoading(true);
            await createAccountCode(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.account_code.success_account_create);
            setTimeout(() => setShowAlert(false), 6000);
            setIsAccountDialogOpen(false);
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
    };

    const handleUpdateAccountCode = async (data: {
        account_code_id: string;
        account_code_name: string;
        account_code_name_alias: string;
        account_type: string;
        parent_account_code_id: string;
        is_active: boolean;
    }) => {
        try {
            setLoading(true);
            await updateAccountCode(data);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.account_code.success_account_update);
            setTimeout(() => setShowAlert(false), 6000);
            setIsAccountDialogOpen(false);
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
    };

    const handleDeleteAccountCode = async({account_code_id} : {account_code_id: string}) => {
        try {
            setLoading(true);
            await deleteAccountCode(account_code_id);
            setShowAlert(true);
            setIsSuccess(true);
            setTitlePopup(t.master.success);
            setMessagePopup(t.account_code.success_account_delete);
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
            <Heading mb={6}>Finance ERP Settings</Heading>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value as "bank-account" | "account-code")}>
                <Tabs.List>
                    <Tabs.Trigger value="bank-account">{t.bank_account.title}</Tabs.Trigger>
                    <Tabs.Trigger value="account-code">{t.account_code.title}</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="bank-account">

                    <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                        <Heading mb={6} width={"100%"}>{t.bank_account.title_2}</Heading>
                        <Flex gap={2} alignItems={"center"}>
                            <InputGroup startElement={<LuSearch />}>
                                <Input placeholder={t.bank_account.search} bg={"white"} value={findBankAccount}
                                    onChange={(e) => setFindBankAccount(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setBankAccountPage(1);
                                            init();
                                        }
                                    }}
                                    width="250px"
                                />
                            </InputGroup>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenBankAccountDialog}>{t.bank_account.create_button}</Button>
                        </Flex>
                    </Flex>           

                    <BankAccountDialog isOpen={isBankDialogOpen}
                        setIsOpen={(open) => {
                            setIsBankDialogOpen(open);
                            if (!open) setEditingBankAccount(null);
                        }}
                        title={editingBankAccount ? t.bank_account.update_button : t.bank_account.create_button}
                        placeholders={editingBankAccount ? { 
                            bank_account_id: editingBankAccount.bank_account_id, 
                            bank_name: editingBankAccount.bank_name,
                            bank_branch: editingBankAccount.bank_branch,
                            bank_number: editingBankAccount.bank_number,
                            is_primary: editingBankAccount.is_primary,
                            currency_id: editingBankAccount.currency_id
                         } : undefined}
                        onSubmit={(data) => {
                            if(editingBankAccount) {
                                handleUpdateBankAccount({
                                    bank_account_id: data.bank_account_id ?? editingBankAccount.bank_account_id,
                                    bank_name: data.bank_name,
                                    currency_id: data.currency_id,
                                    bank_branch: data.bank_branch,
                                    is_primary: data.is_primary
                                })
                            } else {
                                handleCreateBankAccount({
                                    bank_number: data.bank_number,
                                    bank_name: data.bank_name,
                                    currency_id: data.currency_id,
                                    bank_branch: data.bank_branch,
                                    is_primary: data.is_primary
                                })
                            }
                        }}
                    />

                    <Table.Root showColumnBorder variant="outline" background={"white"}>
                        <Table.Header>
                            <Table.Row bg="bg.subtle">
                                <Table.ColumnHeader textAlign={"center"}>{t.bank_account.bank_number}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.bank_account.bank_name}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.bank_account.bank_branch}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.bank_account.currency}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>   
                        <Table.Body>
                            {bankAccountData?.map((bank) => (
                            <Table.Row key={bank.bank_number}>
                                <Table.Cell textAlign={"center"}>{bank.bank_number}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{bank.bank_name}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{bank.bank_branch}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{bank.currency_name} ({bank.currency_symbol})</Table.Cell>
                                <Table.Cell textAlign="center">
                                    <Flex justify="center" gap={4} fontSize={"2xl"}>
                                        <FiEdit style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                setEditingBankAccount(bank);
                                                setIsBankDialogOpen(true);
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
                                                            <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteBankAccount({ bank_account_id: bank.bank_account_id })}>Hapus</Button>
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
                        <Heading mb={6} width={"100%"}>{t.account_code.title_2}</Heading>
                        <Flex gap={2} alignItems={"center"}>
                            <InputGroup startElement={<LuSearch />}>
                                <Input placeholder={t.account_code.search} bg={"white"} value={findAccountCode}
                                    onChange={(e) => setFindAccountCode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            setAccountCodePage(1);
                                            init();
                                        }
                                    }}
                                    width="250px"
                                />
                            </InputGroup>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleOpenAccountCodeDialog}>{t.account_code.create_button}</Button>
                        </Flex>
                    </Flex>

                    <AccountCodeDialog
                        isOpen={isAccountDialogOpen}
                        setIsOpen={(open) => {
                            setIsAccountDialogOpen(open);
                            if (!open) setEditingAccountCode(null);
                        }}
                        title={editingAccountCode ? t.account_code.update_button : t.account_code.create_button}
                        placeholders={
                            editingAccountCode
                            ? {
                                account_code_id: editingAccountCode.account_code_id,
                                account_code: editingAccountCode.account_code,
                                account_code_name: editingAccountCode.account_code_name,
                                account_code_name_alias: editingAccountCode.account_code_name_alias,
                                account_type: editingAccountCode.account_type,
                                is_active: editingAccountCode.is_active,
                                parent_account_code_id: editingAccountCode.parent_account_code_id
                                }
                            : undefined
                        }
                        onSubmit={(data) => {
                            if(editingAccountCode) {
                                handleUpdateAccountCode({
                                    account_code_id: data.account_code_id ?? editingAccountCode.account_code_id,
                                    account_code_name: data.account_code_name,
                                    account_code_name_alias: data.account_code_name_alias ?? editingAccountCode.account_code_name_alias,
                                    account_type: data.account_type,
                                    parent_account_code_id: data.parent_account_code_id ?? editingAccountCode.parent_account_code_id,
                                    is_active: data.is_active
                                })
                            } else {
                                handleCreateAccountCode({
                                    account_code: data.account_code,
                                    account_code_name: data.account_code_name,
                                    account_code_name_alias: data.account_code_name_alias ?? '',
                                    account_type: data.account_type,
                                    parent_account_code_id: data.parent_account_code_id ?? ''
                                })
                            }
                        }}
                    />

                    <UpgradeRequiredDialog
                        isOpen={showUpgradeDialog}
                        onClose={() => setShowUpgradeDialog(false)}
                        currentPackage={""}
                        allowedPackages={["Advanced", "Enterprise"]}
                    />

                    <Table.Root showColumnBorder variant="outline" background={"white"}>
                        <Table.Header>
                            <Table.Row bg="bg.subtle">
                                <Table.ColumnHeader textAlign={"center"}>{t.account_code.account_code}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.account_code.account_code_name}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.account_code.account_code_name_alias}</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>   
                        <Table.Body>
                            {accountCodeData?.map((account) => (
                            <Table.Row key={account.account_code_id}>
                                <Table.Cell textAlign={"center"}>{account.account_code}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{account.account_code_name}</Table.Cell>
                                <Table.Cell textAlign={"center"}>{account.account_code_name_alias}</Table.Cell>
                                <Table.Cell textAlign="center">
                                    <Flex justify="center" gap={4} fontSize={"2xl"}>
                                        <FiEdit
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                            setEditingAccountCode(account);
                                            setIsAccountDialogOpen(true);
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
                                                            <Button bg={"red"} color={"white"} cursor={"pointer"} onClick={() => handleDeleteAccountCode({ account_code_id: account.account_code_id })}>{t.delete_popup.delete}</Button>
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