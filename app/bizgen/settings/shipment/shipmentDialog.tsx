"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Button, CloseButton, Dialog, Field, Input, Portal, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface ShipmentDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        shipment_period_id?: string;
        shipment_period_name?: string;
        shipment_date_range_start?: string;
        shipment_date_range_end?: string;
    };
    onSubmit?: (data: {
        shipment_period_id?: string;
        shipment_period_name: string;
        shipment_date_range_start: string;
        shipment_date_range_end: string;
    }) => void;
}

export default function ShipmentDialog({
    isOpen, setIsOpen,
    title,
    placeholders,
    onSubmit
}: ShipmentDialogProps) {
    const [shipmentPeriodID, setShipmentPeriodID] = useState("");
    const [shipmentPeriodName, setShipmentPeriodName] = useState("");
    const [shipmentDateStart, setShipmentDateStart] = useState("");
    const [shipmentDateEnd, setShipmentDateEnd] = useState("");

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
            
        setShipmentPeriodID(placeholders?.shipment_period_id ?? "");
        setShipmentPeriodName(placeholders?.shipment_period_name ?? "");
        setShipmentDateStart(placeholders?.shipment_date_range_start ?? "");
        setShipmentDateEnd(placeholders?.shipment_date_range_end ?? "");
    
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
                                    <Field.Label>{t.shipment_period.shipment_name}</Field.Label>
                                    <Input placeholder={t.shipment_period.shipment_placeholder} value={shipmentPeriodName} onChange={(e) => setShipmentPeriodName(e.target.value)}/>
                                </Field.Root>                               
                                <Field.Root>
                                    <Field.Label>{t.shipment_period.start_date}</Field.Label>
                                    <Input type="date" value={shipmentDateStart} onChange={(e) => setShipmentDateStart(e.target.value)}/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t.shipment_period.end_date}</Field.Label>
                                    <Input type="date" value={shipmentDateEnd} onChange={(e) => setShipmentDateEnd(e.target.value)}/>
                                </Field.Root>
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    shipment_period_id: shipmentPeriodID,
                                    shipment_period_name: shipmentPeriodName,
                                    shipment_date_range_start: shipmentDateStart.toString(),
                                    shipment_date_range_end: shipmentDateEnd.toString()
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