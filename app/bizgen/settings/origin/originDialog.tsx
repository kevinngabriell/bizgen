"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Dialog,Portal, Field, Input, Button, SimpleGrid, CloseButton, createListCollection, Select, Switch } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface OriginDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        origin_id?: string;
        origin_name?: string;
        is_free_trade?: number;
        region?: string;
    };
    onSubmit?: (data: {
        origin_id?: string;
        origin_name: string;
        is_free_trade: number;
        region: string;
    }) => void;
}

export default function OriginDialog({
    isOpen, setIsOpen,
    title,
    placeholders,
    onSubmit}: 
OriginDialogProps) {
    const [originID, setOriginID] = useState("");
    const [originName, setOriginName] = useState("");
    const [regionSelected, setRegionSelected] = useState<string>();
    const [freeTradeSelected, setFreeTradeSelected] = useState(0);
    
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

        setOriginID(placeholders?.origin_id ?? "");
        setOriginName(placeholders?.origin_name ?? "");
        setRegionSelected(placeholders?.region ?? "");
    }, [placeholders, isOpen]);

    const regions = createListCollection({
        items: [
            { label: "APAC", value: "APAC" },
            { label: "AMER", value: "AMER" },
            { label: "EMEA", value: "EMEA" },
            { label: "MEA", value: "MEA" },
        ],
    })

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
                                    <Field.Label>{t.origin.origin_name}</Field.Label>
                                    <Input placeholder={t.origin.origin_name_placeholder} value={originName} onChange={(e) => setOriginName(e.target.value)}/>
                                </Field.Root>

                                <Field.Root>
                                    <Switch.Root checked={freeTradeSelected === 1} onCheckedChange={(e) => setFreeTradeSelected(e.checked ? 1 : 0)}>
                                        <Switch.Label>{t.origin.free_trade}</Switch.Label><Switch.HiddenInput />
                                        <Switch.Control />
                                    </Switch.Root>
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Select.Root collection={regions} value={regionSelected ? [regionSelected] : []} onValueChange={(details) => setRegionSelected(details.value[0])}  size="sm" width="100%">
                                        <Select.HiddenSelect />
                                        <Select.Label>{t.origin.region_placeholder}</Select.Label>
                                        <Select.Control>
                                            <Select.Trigger>
                                            <Select.ValueText placeholder={t.origin.region} />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                            <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                            <Select.Content>
                                                {regions.items.map((region) => (
                                                <Select.Item item={region} key={region.value}>
                                                    {region.label}
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                                ))}
                                            </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>                                
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    ...(originID && { origin_id: originID }),
                                    origin_name: originName,
                                    region: regionSelected ?? "",
                                    is_free_trade: freeTradeSelected ?? ""
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