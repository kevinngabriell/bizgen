"use client";

import Loading from "@/components/loading";
import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllOrigin, GetOriginData } from "@/lib/master/origin";
import { Button, CloseButton, createListCollection, Dialog, Field, Input, Portal, Select, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface PortDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        port_id?: string;
        port_name?: string;
        origin_id?: string;
    };
   onSubmit?: (data: {
        port_id?: string;
        port_name: string;
        origin_id: string;
    }) => void;
}

export default function PortDialog({title, isOpen,
    setIsOpen, placeholders, onSubmit,
}: PortDialogProps) {
    const [loading, setLoading] = useState(false);
    const [portID, setPortID] = useState("");
    const [portName, setPortName] = useState("");
    const [selectedOrigin, setSelectedOrigin] = useState("");
    const [originOptions, setOriginOptions] = useState<GetOriginData[]>([]);

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

    const originCollection = createListCollection({
        items: originOptions.map((or) => ({
            label: `${or.origin_name}`,
            value: or.origin_id,
        })),
    });

    useEffect(() => {
        if(!isOpen) return;

        init();

        setPortID(placeholders?.port_id ?? "");
        setPortName(placeholders?.port_name ?? "");
        setSelectedOrigin(placeholders?.origin_id ?? "");

        const fetchOrigin = async () => {
            try {
                setLoading(true);
                const res = await getAllOrigin(1, 1000); 
                setOriginOptions(res.data); 
            } catch (e) {
                console.error(e);
                setOriginOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrigin();
    }, [isOpen, placeholders])

    if(loading) return <Loading/>
    
    return(
        <Dialog.Root open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content minW={"60vw"}>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                             <SimpleGrid columns={{ base: 1, md: 1, lg: 1 }} gap="20px">
                                <Field.Root required>
                                    <Field.Label>{t.port.port_name}<Field.RequiredIndicator/></Field.Label>
                                    <Input value={portName} onChange={(e) => setPortName(e.target.value)} placeholder={t.port.port_name_placeholder} />
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>{t.port.origin_country} <Field.RequiredIndicator/> </Field.Label>
                                    <Select.Root collection={originCollection} value={selectedOrigin ? [selectedOrigin] : []}
                                        onValueChange={(details) => setSelectedOrigin(details.value[0])}
                                        size="sm" width="100%">
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder={t.port.origin_country_placeholder} />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {originCollection.items.map((origin) => (
                                                        <Select.Item item={origin} key={origin.value}>
                                                            {origin.label}
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
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} 
                                onClick={() => {
                                    if (onSubmit) {
                                        onSubmit({
                                            port_id: portID,
                                            port_name: portName,
                                            origin_id: selectedOrigin || ""
                                        });
                                    }
                                }}
                            >
                                {t.master.save}
                            </Button>
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