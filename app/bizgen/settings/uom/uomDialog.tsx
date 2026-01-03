"use client";

import { Button, CloseButton, Dialog, Field, Input, Portal, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";

interface UOMDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    uomID: string;
    placeholders?: {
        uomName?: string;
        convensionFactor?: number;
    };
    onSubmit?: (data: {
        uomName: string;
        convensionFactor: number;
    }) => void;
}

export default function UOMDialog({
    isOpen, 
    setIsOpen,
    title,
    placeholders,
    onSubmit
}: UOMDialogProps) {
    const [uomName, setUOMName] = useState("");
    const [conversionFactor, setConversionFactor] = useState<number>(0);

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
                                    <Field.Label>Nama UOM</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.uomName ?? "Masukkan nama satuan"} 
                                        value={uomName} 
                                        onChange={(e) => setUOMName(e.target.value)}
                                    />
                                </Field.Root>  

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Convension Factor</Field.Label>
                                    <Input 
                                        type="number"
                                        step="any" 
                                        placeholder={placeholders?.convensionFactor?.toString() ?? "Masukkan faktor konversi"}
                                        value={conversionFactor}
                                        onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 0)}
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
                                    uomName: uomName,
                                    convensionFactor: conversionFactor
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