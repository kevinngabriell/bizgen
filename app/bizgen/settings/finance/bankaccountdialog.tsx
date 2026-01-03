"use client";
// import { getAllCurrency } from "@/lib/settings/currency";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton } from "@chakra-ui/react";
import { ConfigProvider, Select } from "antd";
import { useEffect, useState } from "react";

interface BankAccountDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        nomorRekening?: string;
        bank?: string;
        cabang?: string;
    };
    onSubmit?: (data: {
        bank_number: string;
        bank_name: string;
        bank_branch: string;
        currency_id: string;
    }) => void;
}

export default function BankAccountDialog({
    title,
    isOpen,
    setIsOpen,
    placeholders,
    onSubmit,
}: BankAccountDialogProps) {
    const [nomorRekening, setNomorRekening] = useState("");
    const [namaBank, setNamaBank] = useState("");
    const [cabangBank, setCabangBank] = useState("");
    const [selected, setSelected] = useState<string>();
    const [currencyOptions, setCurrencyOptions] = useState<{ currency_id: string; currency_name: string }[]>([]);

    useEffect(() => {
        // const fetchCurrency = async () => {
        //     try {
        //         const res = await getAllCurrency(); 
        //         setCurrencyOptions(res.data); 
        //     } catch (e) {
        //         console.error(e);
        //     }
        // };

        // fetchCurrency();
    }, []);

    const handleChange = (value: string) => {
        setSelected(value);
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
                                    <Field.Label>Bank</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.bank ?? "Masukkan nama bank"}
                                        value={namaBank} 
                                        onChange={(e) => setNamaBank(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nomor Rekening</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.nomorRekening ?? "Masukkan nomor rekening"} 
                                        value={nomorRekening} 
                                        onChange={(e) => setNomorRekening(e.target.value)}
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Cabang</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.cabang ?? "Masukkan cabang bank terdaftar"}
                                        value={cabangBank} 
                                        onChange={(e) => setCabangBank(e.target.value)}
                                    />
                                </Field.Root>    

                                <Field.Root w={{ base: "100%", md: "100%", lg: "100%" }}>
                                    <Field.Label>Pilih Mata Uang</Field.Label>
                                    <ConfigProvider
                                        theme={{
                                            components: {
                                                Select: {
                                                    zIndexPopup: 2000, // ✅ ini valid untuk Select saja
                                                },
                                            },
                                        }}
                                    >
                                        <Select
                                            value={selected} 
                                            style={{ width: 200 }}
                                            onChange={handleChange}
                                            options={currencyOptions.map((cur) => ({
                                                value: cur.currency_id,
                                                label: cur.currency_name,
                                            }))}
                                            placeholder="Pilih Menu"
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
                                bank_number: nomorRekening,
                                bank_name: namaBank,
                                bank_branch: cabangBank,
                                currency_id: selected ?? ""
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