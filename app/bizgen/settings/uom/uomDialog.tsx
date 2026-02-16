"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Button, CloseButton, Dialog, Field, Input, Portal, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface UOMDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        uom_id?: string;
        uom_name?: string;
        conversion_factor?: number;
    };
    onSubmit?: (data: {
        uom_id?: string;
        uom_name: string;
        conversion_factor: number;
    }) => void;
}

export default function UOMDialog({
    isOpen, setIsOpen,
    title,
    placeholders,
    onSubmit
}: UOMDialogProps) {
    const [uomID, setUOMID] = useState("");
    const [uomName, setUOMName] = useState("");
    const [conversionFactor, setConversionFactor] = useState<number>(0);

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
            
        setUOMID(placeholders?.uom_id ?? "");
        setUOMName(placeholders?.uom_name ?? "");
        setConversionFactor(placeholders?.conversion_factor ?? 0);
    
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
                                    <Field.Label>{t.uom.uom_name}</Field.Label>
                                    <Input placeholder={t.uom.uom_name_placeholder} value={uomName} onChange={(e) => setUOMName(e.target.value)}/>
                                </Field.Root>  

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>{t.uom.conversion_factor}</Field.Label>
                                    <Input type="number" step="any" placeholder={t.uom.conversion_factor_placeholder} value={conversionFactor} onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 0)}/>
                                </Field.Root>                               
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}  onClick={() =>
                                onSubmit?.({
                                    uom_id: uomID,
                                    uom_name: uomName,
                                    conversion_factor: conversionFactor
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