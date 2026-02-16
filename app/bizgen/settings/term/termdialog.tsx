"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Dialog, Portal, SimpleGrid, Field, CloseButton, Button, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface TermDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        term_id?: string;
        term_name?: string;
    };
    onSubmit?: (data: {
        term_id?: string; 
        term_name: string; 
    }) => void;
}

export default function TermDialog({
    isOpen, setIsOpen, 
    title,
    placeholders,
    onSubmit,
}: TermDialogProps) {
    const [termID, setTermID] = useState("");
    const [termName, setTermName] = useState("");

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
        
        setTermID(placeholders?.term_id ?? "");
        setTermName(placeholders?.term_name ?? "");
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
                                <Field.Root required>
                                    <Field.Label>{t.term.term_name} <Field.RequiredIndicator /> </Field.Label>
                                    <Input required placeholder={t.term.term_name_placeholder} value={termName} onChange={(e) => setTermName(e.target.value)} />
                                </Field.Root>                               
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    term_id: termID,
                                    term_name: termName
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
