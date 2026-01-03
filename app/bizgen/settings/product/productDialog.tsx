"use client";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Textarea } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";

interface ProductDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    placeholders?: {
        product_id?: string;
        product_code?: string;
        product_name?: string;
        product_desc?: string;
    };
    onSubmit?: (data: {product_id?: string; product_code: string; product_name: string; product_desc: string;}) => void;
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
    
    useEffect(() => {
        setProductCode("");
        setProductName("");
        setProductDesc("");
        setProductID("");

        if (placeholders) {
            setProductID(placeholders.product_id ?? "");
            setProductCode(placeholders.product_code ?? "");
            setProductName(placeholders.product_name ?? "");
            setProductDesc(placeholders.product_desc ?? "");
        }
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
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Kode Produk</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.product_code ?? "Masukkan kode produk"}
                                        value={productCode} 
                                        onChange={(e) => setProductCode(e.target.value)} 
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nama Produk</Field.Label>
                                    <Input 
                                        placeholder={placeholders?.product_name ?? "Masukkan nama produk"}
                                        value={productName} 
                                        onChange={(e) => setProductName(e.target.value)} 
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Deskripsi Produk</Field.Label>
                                    <Textarea
                                        maxLines={5} 
                                        placeholder={placeholders?.product_desc ?? "Masukkan deskripsi produk"}
                                        value={productDesc} 
                                        onChange={(e) => setProductDesc(e.target.value)} 
                                    />
                                </Field.Root>                                
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button onClick={() =>
                                onSubmit?.({
                                    product_id: productID,
                                    product_code: productCode,
                                    product_name: productName,
                                    product_desc: productDesc
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