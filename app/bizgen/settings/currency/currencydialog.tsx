"use client";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CurrentDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {currency_name?: string; currency_id?: string;};
    onSubmit?: (data: {currency_id?: string; currency_name: string;}) => void;
}

export default function CurrencyDialog({isOpen, setIsOpen, title, placeholders, onSubmit}: CurrentDialogProps) {
    const [currencyName, setCurrencyName] = useState("");
    const [currencyID, setCurrencyID] = useState("");
    
    useEffect(() => {
        setCurrencyID("");
        setCurrencyName("");
        if (placeholders) {
            setCurrencyName(placeholders.currency_name ?? "");
            setCurrencyID(placeholders.currency_id ?? "");
        }
    }, [placeholders, isOpen]);

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
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Mata Uang</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.currency_name ?? "Masukkan mata uang"} 
                                        value={currencyName} 
                                        onChange={(e) => setCurrencyName(e.target.value)}
                                    />
                                </Field.Root>
                           
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button onClick={() =>
                                onSubmit?.({
                                    currency_id: currencyID,
                                    currency_name: currencyName
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