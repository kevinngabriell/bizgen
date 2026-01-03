"use client";

import { Button, CloseButton, Dialog, Field, Input, Portal, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";

interface ShipViaDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    shipvia_id: string;
    placeholders?: {
        shipName?: string;
    };
    onSubmit?: (data: {
        shipName: string;
    }) => void;
}

export default function ShipViaDialog({
    isOpen, 
    setIsOpen,
    title,
    placeholders,
    onSubmit
}: ShipViaDialogProps) {
    const [shipviaName, setShipViaName] = useState("");

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
                                    <Field.Label>Nama Ship Via</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.shipName ?? "Masukkan metode pengiriman"} 
                                        value={shipviaName} 
                                        onChange={(e) => setShipViaName(e.target.value)}
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
                                    shipName: shipviaName
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