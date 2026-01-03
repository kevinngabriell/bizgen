"use client";
// import { getAllRegion } from "@/lib/settings/region";
import { Dialog,Portal, Field, Input, Button, SimpleGrid, CloseButton } from "@chakra-ui/react";
import { ConfigProvider, Select } from "antd";
import { useEffect, useState } from "react";

interface OriginDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    origin_id: string;
    placeholders?: {
        namaNegara?: string;
        freeTrade?: string;
        region?: string;
    };
    onSubmit?: (data: {
        origin_name: string;
        origin_region: string;
        origin_is_free_trade: string;
    }) => void;
}

export default function OriginDialog({
    isOpen, 
    setIsOpen,
    title,
    placeholders,
    onSubmit}: 
OriginDialogProps) {
    const [namaNegara, setNamaNegara] = useState("");
    const [regionOption, setRegionOption] = useState<{ region_id: string; region_name: string }[]>([]);
    const [regionSelected, setRegionSelected] = useState<string>();
    const [freeTradeSelected, setFreeTradeSelected] = useState<string>();

    useEffect(() => {
        // const fetchRegion = async () => {
        //     try {
        //         const res = await getAllRegion(); 
        //         setRegionOption(res.data); 
        //     } catch (e) {
        //         console.error(e);
        //     }
        // };
    
        // fetchRegion();
    }, []);

    const handleRegionChange = (value: string) => {
        setRegionSelected(value);
    };

    const handleFreeTradeChange = (value: string) => {
        setFreeTradeSelected(value);
    };

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
                                    <Field.Label>Nama Negara</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.namaNegara ?? "Masukkan nama negara"} 
                                        value={namaNegara} 
                                        onChange={(e) => setNamaNegara(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Free Trade</Field.Label>
                                    <ConfigProvider
                                        theme={{
                                            components: {
                                                Select: {
                                                    zIndexPopup: 2000, 
                                                },
                                            },
                                        }}
                                    >
                                        <Select
                                            value={freeTradeSelected} 
                                            style={{ width: 200 }}
                                            onChange={handleFreeTradeChange}
                                            options={[
                                                { value: "1", label: "Ya" },
                                                { value: "0", label: "Tidak" }
                                            ]}
                                            placeholder="Pilih Free Trade"
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement} 
                                        />
                                    </ConfigProvider>
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Region</Field.Label>
                                    <ConfigProvider
                                        theme={{
                                            components: {
                                                Select: {
                                                    zIndexPopup: 2000,
                                                },
                                            },
                                        }}
                                    >
                                        <Select
                                            value={regionSelected} 
                                            style={{ width: 200 }}
                                            onChange={handleRegionChange}
                                            options={regionOption.map((region) => ({
                                                value: region.region_id,
                                                label: region.region_name,
                                            }))}
                                            placeholder="Pilih Region"
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement} 
                                        />
                                    </ConfigProvider>
                                </Field.Root>                                
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button onClick={() =>
                                onSubmit?.({
                                    origin_name: namaNegara,
                                    origin_region: regionSelected ?? "",
                                    origin_is_free_trade: freeTradeSelected ?? ""
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