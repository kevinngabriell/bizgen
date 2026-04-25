"use client";
import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Textarea, NativeSelect } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface ProductDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        item_id?: string;
        item_code?: string;
        item_name?: string;
        item_description?: string;
        item_type?: string;
    };
    onSubmit?: (data: {
        item_id?: string;
        item_code: string;
        item_name: string;
        item_description: string;
        item_type: string;
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
    const [itemType, setItemType] = useState("product");
    
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
        
        setProductID(placeholders?.item_id ?? "");
        setProductCode(placeholders?.item_code ?? "");
        setProductName(placeholders?.item_name ?? "");
        setProductDesc(placeholders?.item_description ?? "");
        setItemType(placeholders?.item_type ?? "product");

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

                                <Field.Root required>
                                    <Field.Label>{t.products.item_type} <Field.RequiredIndicator /></Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field value={itemType} onChange={(e) => setItemType(e.target.value)}>
                                            <option value="product">{t.products.item_type_product}</option>
                                            <option value="service">{t.products.item_type_service}</option>
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
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
                                    item_id: productID,
                                    item_code: productCode,
                                    item_name: productName,
                                    item_description: productDesc,
                                    item_type: itemType,
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