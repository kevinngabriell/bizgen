"use client";

import Loading from "@/components/loading";
import { getLang } from "@/lib/i18n";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { getAllOrigin, GetOriginData } from "@/lib/master/origin";
import { getAllTerm, GetTermData } from "@/lib/master/term";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Textarea, createListCollection, Select } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface SupplierDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        supplier_id?: string;
        supplier_name?: string;
        supplier_origin?: string;
        supplier_address?: string;
        supplier_phone?: string;
        supplier_pic_name?: string;
        supplier_pic_contact?: string;
        supplier_currency?: string;
        supplier_term?: string;
        supplier_bank_information?: string;
    };
   onSubmit?: (data: {
        supplier_id?: string;
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

export default function SupplierDialog({title, isOpen,
    setIsOpen, placeholders, onSubmit,
}: SupplierDialogProps) {
    const [loading, setLoading] = useState(false);
    const [supplierID, setSupplierID] = useState("");
    const [supplierName, setSupplierName] = useState("");
    const [selectedOrigin, setSelectedOrigin] = useState("");
    const [originOptions, setOriginOptions] = useState<GetOriginData[]>([]);
    const [supplierAddress, setSupplierAddress] = useState("");
    const [supplierPhone, setSupplierPhone] = useState("");
    const [supplierPICName, setSupplierPICName] = useState("");
    const [supplierPICContact, setSupplierPICContact] = useState("");
    const [selectedCurrency, setSelectedCurrency] = useState("");
    const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);
    const [selectedTerm, setSelectedTerm] = useState("");
    const [termOptions, setTermOptions] = useState<GetTermData[]>([]);
    const [supplierBankInfo, setSupplierBankInfo] = useState("");
   
    const t = getLang("en"); 

    const originCollection = createListCollection({
        items: originOptions.map((or) => ({
            label: `${or.origin_name}`,
            value: or.origin_id,
        })),
    });

    const currencyCollection = createListCollection({
        items: currencyOptions.map((cur) => ({
            label: `${cur.currency_name} (${cur.currency_symbol})`,
            value: cur.currency_id,
        })),
    });

    const termCollection = createListCollection({
        items: termOptions.map((term) => ({
            label: `${term.term_name}`,
            value: term.term_id,
        })),
    });
    
    useEffect(() => {
        if(!isOpen) return;

        setSupplierID(placeholders?.supplier_id ?? "");
        setSupplierName(placeholders?.supplier_name ?? "");
        setSelectedOrigin(placeholders?.supplier_origin ?? "");
        setSupplierAddress(placeholders?.supplier_address ?? "");
        setSupplierPhone(placeholders?.supplier_phone ?? "");
        setSupplierPICName(placeholders?.supplier_pic_name ?? "");
        setSupplierPICContact(placeholders?.supplier_pic_contact ?? "");
        setSelectedCurrency(placeholders?.supplier_currency ?? "");
        setSelectedTerm(placeholders?.supplier_term ?? "");
        setSupplierBankInfo(placeholders?.supplier_bank_information ?? "");

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

        const fetchCurrency = async () => {
            try {
                setLoading(true);
                const res = await getAllCurrency(1, 1000); 
                setCurrencyOptions(res.data); 
            } catch (e) {
                console.error(e);
                setCurrencyOptions([]);
            } finally {
                setLoading(false);
            }
        };

        const fetchTerm = async () => {
            try {  
                setLoading(true);
                const res = await getAllTerm(1, 1000); 
                setTermOptions(res.data); 
            } catch (e) {
                console.error(e);
                setTermOptions([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchTerm();
        fetchOrigin();
        fetchCurrency();
    }, [isOpen, placeholders]);

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
                            <SimpleGrid columns={{ base: 1, md: 1, lg: 2 }} gap="20px">
                                <Field.Root required>
                                    <Field.Label>{t.supplier.supplier_name} <Field.RequiredIndicator/></Field.Label>
                                    <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder={t.supplier.supplier_name_placeholder} />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_phone}</Field.Label>
                                    <Input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} placeholder={t.supplier.supplier_phone}/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_address}</Field.Label>
                                    <Textarea  value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} placeholder={t.supplier.supplier_address_placeholder}/>
                                </Field.Root>     

                                <Field.Root required>
                                    <Field.Label>{t.supplier.supplier_origin} <Field.RequiredIndicator/> </Field.Label>
                                    <Select.Root collection={originCollection} value={selectedOrigin ? [selectedOrigin] : []}
                                        onValueChange={(details) => setSelectedOrigin(details.value[0])}
                                        size="sm" width="100%">
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder={t.supplier.supplier_origin_placeholder} />
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

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_pic_name}</Field.Label>
                                    <Input value={supplierPICName} onChange={(e) => setSupplierPICName(e.target.value)} placeholder={t.supplier.supplier_pic_name_placeholder}/>
                                </Field.Root>   

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_pic_contact}</Field.Label>
                                    <Input value={supplierPICContact} onChange={(e) => setSupplierPICContact(e.target.value)} placeholder={t.supplier.supplier_pic_contact_placeholder}/>
                                </Field.Root>  

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_currency}</Field.Label>
                                    <Select.Root collection={currencyCollection} value={selectedCurrency ? [selectedCurrency] : []}
                                        onValueChange={(details) => setSelectedCurrency(details.value[0])}
                                        size="sm" width="100%">
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder={t.supplier.supplier_currency_placeholder} />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {currencyCollection.items.map((curr) => (
                                                        <Select.Item item={curr} key={curr.value}>
                                                            {curr.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>    

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_term}</Field.Label>
                                    <Select.Root collection={termCollection} value={selectedTerm ? [selectedTerm] : []}
                                        onValueChange={(details) => setSelectedTerm(details.value[0])}
                                        size="sm" width="100%">
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder={t.supplier.supplier_term_placeholder} />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {termCollection.items.map((term) => (
                                                        <Select.Item item={term} key={term.value}>
                                                            {term.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>   

                                <Field.Root>
                                    <Field.Label>{t.supplier.supplier_bank_info}</Field.Label>
                                    <Textarea value={supplierBankInfo} onChange={(e) => setSupplierBankInfo(e.target.value)} placeholder={t.supplier.supplier_bank_info_placeholder}/>
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
                                            supplier_id: supplierID,
                                            supplier_name: supplierName,
                                            supplier_origin: selectedOrigin || "",
                                            supplier_address: supplierAddress,
                                            supplier_phone: supplierPhone,
                                            supplier_pic_name: supplierPICName,
                                            supplier_pic_contact: supplierPICContact,
                                            supplier_currency: selectedCurrency || "",
                                            supplier_term: selectedTerm || "",
                                            supplier_bank_information: supplierBankInfo,
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