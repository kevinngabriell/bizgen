"use client";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CurrentDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {currency_name?: string; currency_id?: string; currency_code?: string; currency_symbol?: string;};
    onSubmit?: (data: {currency_id?: string; currency_name: string; currency_code: string; currency_symbol: string;}) => void;
}

export default function CurrencyDialog({isOpen, setIsOpen, title, placeholders, onSubmit}: CurrentDialogProps) {
    const [currencyCode, setCurrencyCode] = useState("");
    const [currencyName, setCurrencyName] = useState("");
    const [currencyID, setCurrencyID] = useState("");
    const [currencySymbol, setCurrencySymbol] = useState("");
    
    useEffect(() => {
        if (!isOpen) return;

        setCurrencyID(placeholders?.currency_id ?? "");
        setCurrencyName(placeholders?.currency_name ?? "");
        setCurrencyCode(placeholders?.currency_code ?? "");
        setCurrencySymbol(placeholders?.currency_symbol ?? "");
    }, [placeholders, isOpen]);

    const isValid = currencyCode.length === 3 && currencyName.trim().length > 0 && 
                    currencySymbol.trim().length > 0 && currencySymbol.trim().length <= 5;

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
                                <Field.Root>
                                    <Field.Label>Kode Mata Uang</Field.Label>
                                    <Input required placeholder={"Masukkan kode ISO mata uang"} value={currencyCode} maxLength={3}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                                        setCurrencyCode(value);
                                    }}/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Nama Mata Uang</Field.Label>
                                    <Input required placeholder={"Masukkan mata uang"} value={currencyName} onChange={(e) => setCurrencyName(e.target.value)}/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Simbol Mata Uang</Field.Label>
                                    <Input required placeholder={"Masukkan simbol uang"} value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)}/>
                                </Field.Root>
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button disabled={!isValid} bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    currency_code: currencyCode,
                                    ...(currencyID && { currency_id: currencyID }),
                                    currency_name: currencyName,
                                    currency_symbol: currencySymbol
                                })
                            }>Simpan</Button>
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