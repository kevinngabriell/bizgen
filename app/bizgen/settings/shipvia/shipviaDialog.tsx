"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Button, CloseButton, Dialog, Field, Input, Portal, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface ShipViaDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        ship_via_id?: string;
        ship_via_name?: string;
    };
    onSubmit?: (data: {
        ship_via_id?: string;
        ship_via_name: string;
    }) => void;
}

export default function ShipViaDialog({
    isOpen, setIsOpen,
    title,
    placeholders,
    onSubmit
}: ShipViaDialogProps) {
    const [shipviaID, setShipViaID] = useState("");
    const [shipviaName, setShipViaName] = useState("");

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
        
    useEffect(() => {
        if (!isOpen) return;

        init();
            
        setShipViaID(placeholders?.ship_via_id ?? "");
        setShipViaName(placeholders?.ship_via_name ?? "");
    
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
                                <Field.Root>
                                    <Field.Label>{t.ship_via.ship_via_name}</Field.Label>
                                    <Input value={shipviaName} placeholder={t.ship_via.ship_via_name_placeholder} onChange={(e) => setShipViaName(e.target.value)}/>
                                </Field.Root>                               
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    ship_via_id: shipviaID,
                                    ship_via_name: shipviaName
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