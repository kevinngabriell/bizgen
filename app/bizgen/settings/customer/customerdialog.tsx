"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Textarea, Select, createListCollection } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CustomerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: { customer_id?: string;
        customer_name?: string; customer_phone?: string; 
        customer_address?: string; customer_pic?: string; customer_contact_pic?: string; 
        customer_top?: number; 
    };
    onSubmit?: ( data: {customer_id?: string;
        customer_name: string; customer_phone: string;
        customer_address: string; customer_pic: string; customer_contact_pic: string;
        customer_top: number;
    }) => void;
}

export default function CustomerDialog({
    isOpen, setIsOpen,
    title,
    placeholders,
    onSubmit,
}: CustomerDialogProps) {
    const [customerID, setCustomerID] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerPIC, setCustomerPIC] = useState("");
    const [customerPICContact, setCustomerPICContact] = useState("");
    const [customerTOP, setCustomerTOP] = useState<number>(0);
    const [isCOD, setIsCOD] = useState(false);

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

    const paymentTypes = createListCollection({
        items: [
            { label: "COD", value: "cod" },
            { label: "TOP (Term of Payment)", value: "top" },
        ],
    });

    useEffect(() => {
        if (!isOpen) return;

        setCustomerID(placeholders?.customer_id ?? "");
        setCustomerName(placeholders?.customer_name ?? "");
        setCustomerAddress(placeholders?.customer_address ?? "");
        setCustomerPhone(placeholders?.customer_phone ?? "");
        setCustomerPIC(placeholders?.customer_pic ?? "");
        setCustomerPICContact(placeholders?.customer_contact_pic ?? "");
        setCustomerTOP(Number(placeholders?.customer_top ?? 0));
        const topValue = Number(placeholders?.customer_top ?? 0);
        setIsCOD(topValue === 0);

        init();
        
    }, [placeholders, isOpen]);

    const isPhoneValid = /^[0-9]{10,}$/.test(customerPhone);
    const isValid = customerName.length > 0 && isPhoneValid && (isCOD || customerTOP > 0);

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
                                    <Field.Label>{t.customer.customer_name} <Field.RequiredIndicator /> </Field.Label>
                                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t.customer.customer_name_placeholder}/>
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>{t.customer.customer_phone} <Field.RequiredIndicator /> </Field.Label>
                                    <Input value={customerPhone} placeholder={t.customer.customer_phone_placeholder}
                                        onChange={(e) => { 
                                            const numeric = e.target.value.replace(/[^0-9]/g, "");
                                            setCustomerPhone(numeric);
                                        }}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t.customer.customer_address}</Field.Label>
                                    <Textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder={t.customer.customer_address_placeholder} maxLines={5}/>
                                </Field.Root> 

                                <Field.Root>
                                    <Field.Label>{t.customer.customer_pic}</Field.Label>
                                    <Input value={customerPIC} onChange={(e) => setCustomerPIC(e.target.value)} placeholder={t.customer.customer_pic_placeholder}/>
                                </Field.Root>   

                                <Field.Root>
                                    <Field.Label>{t.customer.customer_pic_contact}</Field.Label>
                                    <Input value={customerPICContact} onChange={(e) => setCustomerPICContact(e.target.value)} placeholder={t.customer.customer_pic_contact_placeholder}/>
                                </Field.Root> 

                                <Field.Root>
                                    <Field.Label>{t.customer.customer_top}</Field.Label>
                                    <Select.Root collection={paymentTypes} value={[isCOD ? "cod" : "top"]}
                                        onValueChange={(details) => {
                                            const cod = details.value[0] === "cod";
                                            setIsCOD(cod);
                                            if (cod) setCustomerTOP(0);
                                        }}
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder={t.customer.customer_top_placeholder} />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {paymentTypes.items.map((type) => (
                                                        <Select.Item item={type} key={type.value}>
                                                            {type.label}
                                                            <Select.ItemIndicator />
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Positioner>
                                        </Portal>
                                    </Select.Root>
                                </Field.Root>

                                {!isCOD && (
                                    <Field.Root>
                                        <Field.Label>{t.customer.customer_top}</Field.Label>
                                        <Input type="number" value={customerTOP} placeholder={t.customer.customer_top_placeholder} onChange={(e) => setCustomerTOP(Number(e.target.value))}/>
                                    </Field.Root>
                                )}                             
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button disabled={!isValid} bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    ...(customerID && { customer_id: customerID }),
                                    customer_name: customerName,
                                    customer_address: customerAddress,
                                    customer_phone: customerPhone,
                                    customer_pic: customerPIC,
                                    customer_contact_pic: customerPICContact,
                                    customer_top: customerTOP
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