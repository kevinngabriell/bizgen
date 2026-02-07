"use client";
import { getLang } from "@/lib/i18n";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface ProductDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        product_id?: string;
        product_code?: string;
        product_name?: string;
        product_description?: string;
    };
    onSubmit?: (data: {
        product_id?: string; 
        product_code: string; 
        product_name: string; 
        product_description: string;
    }) => void;
}

export default function ProductDialog({
    isOpen, setIsOpen, 
    title,
    placeholders,
    onSubmit,
}: ProductDialogProps) {
    const [productCode, setProductCode] = useState("");
    const [productName, setProductName] = useState("");
    const [productDesc, setProductDesc] = useState("");
    const [productID, setProductID] = useState("");

    const t = getLang("en"); 
    
    useEffect(() => {
        if (!isOpen) return;
        
        setProductID(placeholders?.product_id ?? "");
        setProductCode(placeholders?.product_code ?? "");
        setProductName(placeholders?.product_name ?? "");
        setProductDesc(placeholders?.product_description ?? "");

    }, [placeholders, isOpen]);

    const isValid = productCode.length > 0 && productName.length > 0;

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
                                    <Field.Label>{t.products.product_code} <Field.RequiredIndicator /> </Field.Label>
                                    <Input required placeholder={t.products.product_code_placeholder} value={productCode} onChange={(e) => setProductCode(e.target.value)} />
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>{t.products.product_name} <Field.RequiredIndicator /> </Field.Label>
                                    <Input required placeholder={t.products.product_name_placeholder} value={productName} onChange={(e) => setProductName(e.target.value)} />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>{t.products.product_description}</Field.Label>
                                    <Textarea maxLines={5}  placeholder={t.products.product_description_placeholder} value={productDesc} onChange={(e) => setProductDesc(e.target.value)} />
                                </Field.Root>                                
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">{t.delete_popup.cancel}</Button>
                            </Dialog.ActionTrigger>
                            <Button disabled={!isValid}  bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() =>
                                onSubmit?.({
                                    product_id: productID,
                                    product_code: productCode,
                                    product_name: productName,
                                    product_description: productDesc
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