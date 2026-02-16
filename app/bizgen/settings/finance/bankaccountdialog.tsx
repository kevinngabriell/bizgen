"use client";

import Loading from "@/components/loading";
import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Switch, Select, createListCollection } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface BankAccountDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        bank_account_id?: string;
        bank_number?: string;
        bank_name?: string;
        bank_branch?: string;
        currency_id?: string;
        is_primary?: boolean;
    };
    onSubmit?: (data: {
        bank_account_id?: string;
        bank_number: string;
        bank_name: string;
        bank_branch: string;
        currency_id: string;
        is_primary: boolean;
    }) => void;
}

export default function BankAccountDialog({title, isOpen, setIsOpen,
    placeholders, onSubmit,
}: BankAccountDialogProps) {
    const [loading, setLoading] = useState(false);
    const [bankAccountID, setBankAccountID] = useState("");
    const [bankNumber, setBankNumber] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankBranch, setBankBranch] = useState("");
    const [selected, setSelected] = useState<string>();
    const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
    const [isPrimary, setIsPrimary] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    const init = async () => {
        //get info from authentication
        const info = getAuthInfo();

        //set language from token authentication
        const language = info?.language === "id" ? "id" : "en";
        setLang(language);
    }

    const currencyCollection = createListCollection({
        items: currencyOptions.map((cur) => ({
            label: `${cur.currency_name} (${cur.currency_symbol})`,
            value: cur.currency_id,
        })),
    });

    useEffect(() => {
        if(!isOpen) return;

        init();
        
        setBankAccountID(placeholders?.bank_account_id ?? "");
        setBankNumber(placeholders?.bank_number ?? "");
        setBankName(placeholders?.bank_name ?? "");
        setBankBranch(placeholders?.bank_branch ?? "");
        setIsPrimary(placeholders?.is_primary ?? false);
        setSelected(placeholders?.currency_id ?? undefined);

        const fetchCurrency = async () => {
            try {
                setLoading(true);
                const currencyRes = await getAllCurrency(1, 1000);
                setCurrencyOptions(currencyRes?.data ?? []);
            } catch (error) {
                console.error(error);
                setCurrencyOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrency();
    }, [isOpen, placeholders]);

    if(loading) return <Loading/>

    return(
        <Dialog.Root open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <SimpleGrid columns={{ base: 1, md: 1, lg: 1 }} gap="20px">
                                <Field.Root required>
                                    <Field.Label>{t.bank_account.bank_name} <Field.RequiredIndicator/> </Field.Label>
                                    <Input placeholder={t.bank_account.bank_name_placeholder} value={bankName} onChange={(e) => setBankName(e.target.value)}/>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>{t.bank_account.bank_number} <Field.RequiredIndicator/> </Field.Label>
                                    <Input  placeholder={t.bank_account.bank_number} value={bankNumber} onChange={(e) => setBankNumber(e.target.value)}/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t.bank_account.bank_branch}</Field.Label>
                                    <Input placeholder={t.bank_account.bank_branch_placeholder} value={bankBranch} onChange={(e) => setBankBranch(e.target.value)}/>
                                </Field.Root>    

                                <Field.Root required>
                                    <Field.Label>{t.bank_account.select_currency}  <Field.RequiredIndicator/> </Field.Label>
                                    <Select.Root collection={currencyCollection} value={selected ? [selected] : []} onValueChange={(details) => setSelected(details.value[0])} size="sm" width="100%">
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder={t.bank_account.select_currency_placeholder} />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {currencyCollection.items.map((currency) => (
                                                        <Select.Item item={currency} key={currency.value}>
                                                            {currency.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>             

                                <Switch.Root colorPalette={"#E77A1F"} checked={isPrimary} onCheckedChange={(details) => setIsPrimary(details.checked)}>
                                    <Switch.HiddenInput />
                                    <Switch.Control />
                                    <Switch.Label>{t.bank_account.primary}</Switch.Label>
                                </Switch.Root>      
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    bank_account_id: bankAccountID,
                                    bank_number: bankNumber,
                                    bank_name: bankName,
                                    bank_branch: bankBranch,
                                    currency_id: selected ?? "",
                                    is_primary: isPrimary
                                })
                            }>{t.master.save}</Button>
                        </Dialog.Footer>

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>

                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}