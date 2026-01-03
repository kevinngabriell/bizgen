"use client";

import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, useFilter, useListCollection} from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";

interface SettingUserDialogProps {
    triggerIcon: ReactNode;
    title: string;
    username: string;
    action: string;
    placeholders?: {
        firstName?: string;
        lastName?: string;
        username?: string;
        company_id?: string;
        company_name?: string;
        permission_id?: string;
        permission_name?: string;
    };
    onSubmit?: () => void;
}

export default function UserDialog({
    triggerIcon,
    title,
    action,
    username,
} : SettingUserDialogProps) {
   
    const { contains } = useFilter({ sensitivity: "base" });
    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    // const [userData, setUserData] = useState<Users | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // useEffect(() => {
    //     if (!isOpen) return;

    //     const init = async () => {
    //         setLoading(true);

    //         const valid = await checkAuthOrRedirect();
    //         if (!valid) return;

    //         const info = getAuthInfo();
    //         setAuth(info);

    //         try {
    //         const data = await getUser(username);
    //         setUserData(data);
    //         } catch (err) {
    //         setUserData(null);
    //         } finally {
    //         setLoading(false);
    //         }
    //     };

    //     init();
    // }, [isOpen]);

    // const { collection, filter } = useListCollection({
    //     initialItems: access,
    //     filter: contains
    // });

    // if(loading) return <Loading/>

    return(
        
        <Dialog.Root open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
            <Dialog.Trigger asChild>{triggerIcon}</Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap="20px" background={"transparent"}>
                                                        
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nama</Field.Label>
                                    {action === "view" ? 
                                        <Input placeholder="Masukkan nama user disini" value={""} readOnly/> : 
                                        <Input value={"w"}/>
                                    }
                                </Field.Root>
                                                        
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Username</Field.Label>
                                    {action === "view" ? 
                                        <Input placeholder="Masukkan username user disini" value={""} readOnly/> : 
                                        <Input value={"w"} />
                                    }
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nama Perusahaan</Field.Label>
                                    {action === "view" ? 
                                        <Input placeholder="Masukkan nama perusahaan user disini" value={""} readOnly/> : 
                                        <Input value={"w"} />
                                    }
                                </Field.Root>
                            
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            {action === "view" ? <div></div> : <Button>Update Data User</Button>}
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

const access = [
    { id: 1, package: "Premium", access: "Full Access" },
    { id: 2, package: "Premium", access: "Sales Module" },
    { id: 3, package: "Premium", access: "Purchase Module" },
    { id: 4, package: "Premium", access: "Warehouse Module" },
    { id: 5, package: "Premium", access: "Finance Module" },
    { id: 6, package: "Demo", access: "Demo Access" }
]