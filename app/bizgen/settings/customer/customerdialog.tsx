"use client";
// import Loading from "@/components/loading";
// import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
// import { Customer, getDetailCustomer } from "@/lib/settings/customer";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Textarea } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CustomerDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    title: string;
    customer_id: string;
    placeholders?: { 
        customerName?: string; 
        phoneNumber?: string; 
        address?: string; 
        picName?: string; 
        picContact?: string; 
        customerTOP?: string; 
    };
    onSubmit?: ( data: {
        customer_id?: string;
        company_id?: string;
        customer_name: string;
        customer_address: string;
        customer_phone: string;
        customer_pic: string;
        customer_contact_pic: string;
        top: string;
    }) => void;
}

export default function CustomerDialog({
    isOpen, setIsOpen,
    title,
    customer_id,
    onSubmit,
}: CustomerDialogProps) {

    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    // const [customerData, setCustomerData] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerPIC, setCustomerPIC] = useState("");
    const [customerPICContact, setCustomerPICContact] = useState("");
    const [customerTOP, setCustomerTOP] = useState("");

    // useEffect(() => {
    //     if (!isOpen) return;

    //     const init = async () => {
    //         setLoading(true);

    //         const valid = await checkAuthOrRedirect();
    //         if (!valid) return;

    //         const info = getAuthInfo();
    //         setAuth(info);

    //         try {
    //             if (customer_id) {
    //                 const response = await getDetailCustomer(customer_id);
    //                 const customer = response.data[0];
    //                 if (customer) {
    //                 setCustomerName(customer.customer_name || "");
    //                 setCustomerPhone(customer.customer_phone || "");
    //                 setCustomerAddress(customer.customer_address || "");
    //                 setCustomerPIC(customer.customer_pic || "");
    //                 setCustomerPICContact(customer.customer_contact_pic || "");
    //                 setCustomerTOP(customer.customer_top || "");
    //                 }
    //             } else {
    //                 setCustomerName("");
    //                 setCustomerPhone("");
    //                 setCustomerAddress("");
    //                 setCustomerPIC("");
    //                 setCustomerPICContact("");
    //                 setCustomerTOP("");
    //             }
    //         } catch (err) {
    //             setCustomerData(null);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     init();
    // }, [isOpen]);    

    // if(loading) return <Loading/>

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
                                    <Field.Label>Nama</Field.Label>
                                    <Input 
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Masukkan nama konsumen"
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nomor Telepon</Field.Label>
                                    <Input 
                                        value={'customerData?.customer_phone ?? customerPhone'}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder={"Masukkan nomor telepon"}
                                    />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Alamat</Field.Label>
                                    <Textarea 
                                        value={'customerData?.customer_address ?? customerAddress'}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        placeholder={"Masukkan alamat"}
                                        maxLines={5}
                                    />
                                </Field.Root> 

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nama PIC</Field.Label>
                                    <Input 
                                        value={'customerData?.customer_pic ?? customerPIC'}
                                        onChange={(e) => setCustomerPIC(e.target.value)}
                                        placeholder={"Masukkan nama pic"}
                                    />
                                </Field.Root>   

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Kontak PIC</Field.Label>
                                    <Input 
                                        value={'customerData?.customer_contact_pic ?? customerPICContact'}
                                        onChange={(e) => setCustomerPICContact(e.target.value)}
                                        placeholder={"Masukkan nomor telepon PIC"}
                                    />
                                </Field.Root> 

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>TOP</Field.Label>
                                    <Input 
                                        type="number"
                                        value={'customerData?.customer_top ?? customerTOP'}
                                        placeholder={"Masukkan jumlah TOP"}
                                        onChange={(e) => setCustomerTOP(e.target.value)}
                                    />
                                </Field.Root>                              
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button>Simpan</Button>
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