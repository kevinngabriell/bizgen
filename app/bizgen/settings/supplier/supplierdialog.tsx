"use client";
// import { getAllCurrency } from "@/lib/settings/currency";
// import { getAllOrigin } from "@/lib/settings/origin";
// import { getAllTerm } from "@/lib/settings/term";
import {
  Dialog,
  Portal,
  Field,
  Input,
  Button,
  SimpleGrid,
  CloseButton,
  Textarea,
} from "@chakra-ui/react";
import { ConfigProvider, Select } from "antd";
import { useEffect, useState } from "react";

interface SupplierDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        namaSupplier?: string;
        nomorSupplier?: string;
        alamatSupplier?: string;
        asalSupplier?: string;
        picSupplier?: string;
        nomorpicSupplier?: string;
        matauangSupplier?: string;
        termSupplier?: string;
        informasibanSupplier?: string;
    };
   onSubmit?: (data: {
        supplier_name: string;
        supplier_origin: string;
        supplier_address: string;
        supplier_phone: string;
        supplier_pic_name: string;
        supplier_pic_contact: string;
        supplier_currency: string;
        supplier_term: string;
        supplier_bank_information: string;
    }) => void;
}

export default function SupplierDialog({
    title,
    isOpen,
    setIsOpen,
    placeholders,
    onSubmit,
}: SupplierDialogProps) {
    const [namaSupplier, setNamaSupplier] = useState("");
    const [kontakSupplier, setKontakSupplier] = useState("");
    const [alamatSupplier, setAlamatSupplier] = useState("");
    const [originSelected, setOriginSelected] = useState<string>();
    const [originOptions, setOriginOptions] = useState<{ origin_id: string; origin_name: string; region: string; origin_is_free_trade: string; }[]>([]);
    const [currencySelected, setCurrencySelected] = useState<string>();
    const [currencyOptions, setCurrencyOptions] = useState<{ currency_id: string; currency_name: string; }[]>([]);
    const [termSelected, setTermSelected] = useState<string>();
    const [termOptions, setTermOptions] = useState<{ term_id: string; term_name: string; }[]>([]);
    const [namaPIC, setNamaPIC] = useState("");
    const [kontakPIC, setKontakPIC] = useState("");
    const [informasiBank, setInformasiBank] = useState("");

    // useEffect(() => {
    //     const fetchOrigin = async () => {
    //         try {
    //             const res = await getAllOrigin(); 
    //             setOriginOptions(res.data); 
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     };

    //     const fetchCurrency = async () => {
    //         try {
    //             const res = await getAllCurrency(); 
    //             setCurrencyOptions(res.data); 
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     };

    //     const fetchTerm = async () => {
    //         try {
    //             const res = await getAllTerm(); 
    //             setTermOptions(res.data); 
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     };
        
    //     fetchTerm();
    //     fetchOrigin();
    //     fetchCurrency();
    // }, []);
    
    const handleOriginChange = (value: string) => {
        setOriginSelected(value);
    };

    const handleCurrencyChange = (value: string) => {
        setCurrencySelected(value);
    };

    const handleTermChange = (value: string) => {
        setTermSelected(value);
    };

    const onOriginSearch = (value: string) => {
        setOriginSelected(value);
    };

    const onCurrencySearch = (value: string) => {
        setCurrencySelected(value);
    };

     const onTermSearch = (value: string) => {
        setTermSelected(value);
    };

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
                            <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} gap="20px">
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nama Supplier</Field.Label>
                                    <Input 
                                        value={namaSupplier} 
                                        onChange={(e) => setNamaSupplier(e.target.value)}
                                        placeholder={placeholders?.namaSupplier ?? "Masukkan nama supplier"} 
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Kontak Supplier</Field.Label>
                                    <Input 
                                        value={kontakSupplier} 
                                        onChange={(e) => setKontakSupplier(e.target.value)}
                                        placeholder={placeholders?.nomorSupplier ?? "Masukkan kontak supplier"}
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Alamat Supplier</Field.Label>
                                    <Textarea 
                                        value={alamatSupplier} 
                                        onChange={(e) => setAlamatSupplier(e.target.value)}
                                        placeholder={placeholders?.alamatSupplier ?? "Masukkan alamat supplier"}
                                    />
                                </Field.Root>     

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Asal Supplier</Field.Label>
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
                                            showSearch
                                            value={originSelected} 
                                            style={{ width: 200 }}
                                            onSearch={onOriginSearch}
                                            onChange={handleOriginChange}
                                            optionFilterProp="label"
                                            options={originOptions.map((origin) => ({
                                                value: origin.origin_id,
                                                label: origin.origin_name,
                                            }))}
                                            placeholder="Pilih Asal Supplier"
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement} 
                                        />
                                    </ConfigProvider>
                                </Field.Root>   

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nama PIC Supplier</Field.Label>
                                    <Input 
                                        value={namaPIC} 
                                        onChange={(e) => setNamaPIC(e.target.value)}
                                        placeholder={placeholders?.picSupplier ?? "Masukkan nama PIC supplier"}
                                    />
                                </Field.Root>   

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Kontak PIC Supplier</Field.Label>
                                    <Input 
                                        value={kontakPIC} 
                                        onChange={(e) => setKontakPIC(e.target.value)}
                                        placeholder={placeholders?.nomorpicSupplier ?? "Masukkan nomor PIC supplier"}
                                    />
                                </Field.Root>  

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Mata Uang</Field.Label>
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
                                            showSearch
                                            value={currencySelected} 
                                            onSearch={onCurrencySearch}
                                            style={{ width: 200 }}
                                            onChange={handleCurrencyChange}
                                            optionFilterProp="label"
                                            options={currencyOptions.map((currency) => ({
                                                value: currency.currency_id,
                                                label: currency.currency_name,
                                            }))}
                                            placeholder="Pilih Mata Uang"
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement} 
                                        />
                                    </ConfigProvider>
                                </Field.Root>    

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Term Supplier</Field.Label>
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
                                            showSearch
                                            value={termSelected} 
                                            style={{ width: 200 }}
                                            onSearch={onTermSearch}
                                            onChange={handleTermChange}
                                            optionFilterProp="label"
                                            options={termOptions.map((term) => ({
                                                value: term.term_id,
                                                label: term.term_name,
                                            }))}
                                            placeholder="Pilih Term"
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement} 
                                        />
                                    </ConfigProvider>
                                </Field.Root>   

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Informasi Bank Supplier</Field.Label>
                                    <Textarea 
                                        value={informasiBank} 
                                        onChange={(e) => setInformasiBank(e.target.value)}
                                        placeholder={placeholders?.informasibanSupplier ?? "Masukkan informasi bank supplier"}
                                    />
                                </Field.Root>                                         
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                onClick={() => {
                                    if (onSubmit) {
                                        onSubmit({
                                            supplier_name: namaSupplier,
                                            supplier_origin: originSelected || "",
                                            supplier_address: alamatSupplier,
                                            supplier_phone: kontakSupplier,
                                            supplier_pic_name: namaPIC,
                                            supplier_pic_contact: kontakPIC,
                                            supplier_currency: currencySelected || "",
                                            supplier_term: termSelected || "",
                                            supplier_bank_information: informasiBank,
                                        });
                                    }
                                }}
                            >
                                Simpan
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