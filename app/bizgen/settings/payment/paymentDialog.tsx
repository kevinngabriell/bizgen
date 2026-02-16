"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton} from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface PaymentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  placeholders?: {
    payment_id?: string;
    payment_name?: string;
  };
  onSubmit?: (data: {
    payment_id?: string;
    payment_name: string;
  }) => void;
}

export default function PaymentMethodDialog({
    isOpen, setIsOpen, 
    title,
    placeholders,
    onSubmit,
}: PaymentDialogProps) {
    const [paymentID, setPaymentID] = useState('');
    const [paymentName, setPaymentName] = useState('');

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
        
        setPaymentID(placeholders?.payment_id ?? "");
        setPaymentName(placeholders?.payment_name ?? "");

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
                                    <Field.Label>{t.payment_method.payment_name}</Field.Label>
                                    <Input placeholder={t.payment_method.payment_name_placeholder} value={paymentName} onChange={(e) => setPaymentName(e.target.value)}/>
                                </Field.Root>
                           
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    payment_id: paymentID,
                                    payment_name: paymentName
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