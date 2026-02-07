"use client";

import { Button, CloseButton, Dialog, Field, Input, Portal, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";

interface ShipmentDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        shipment_name?: string;
    };
    onSubmit?: (data: {
        shipment_name: string;
    }) => void;
}

export default function ShipmentDialog({
    isOpen, 
    setIsOpen,
    title,
    placeholders,
    onSubmit
}: ShipmentDialogProps) {
    const [shipmentName, setShipmentName] = useState("");

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
                                    <Field.Label>Nama Shipment</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.shipment_name ?? "Masukkan periode pengiriman"} 
                                        value={shipmentName} 
                                        onChange={(e) => setShipmentName(e.target.value)}
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
                                    shipment_name: shipmentName
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