"use client";

import { getAllSupplier, GetSupplierData } from "@/lib/master/supplier";
import { Button, CloseButton, Dialog, Input, InputGroup, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Loading from "../loading";
import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (supplier: GetSupplierData) => void;
};

export default function SupplierLookup({
    isOpen, onClose, onChoose
}: Props) {
    const [supplier, setSupplier] = useState<GetSupplierData[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

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

    const fetchSupplier = async (search?: string) => {
        try {
            setLoading(true);
            const supplierRes = await getAllSupplier(1, 1000, search);
            setSupplier(supplierRes?.data ?? []);
        } catch (err) {
            console.error(err);
            setSupplier([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        init();

        if (isOpen) {
            fetchSupplier();
        }
    }, [isOpen]);

    useEffect(() => {
        const delay = setTimeout(() => {
        if (isOpen) {
            fetchSupplier(search);
        }
        }, 400);

        return () => clearTimeout(delay);
    }, [search]);

    return(
        <Dialog.Root open={isOpen} onOpenChange={(e) => {if (!e.open) onClose(); }}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content minW={"60vw"}>
                        <Dialog.Header>
                            <Dialog.Title>Choose Supplier</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <InputGroup startElement={<LuSearch/>} mb={5}>
                                <Input placeholder="Enter customer name....." value={search} onChange={(e) => setSearch(e.target.value)}/>
                            </InputGroup>                
                            
                            {loading ? (
                                <Loading/>
                            ) : supplier.length === 0 ? (
                                <Text>No supplier found</Text>
                            ) : (
                                <Table.Root>
                                    <Table.Header>
                                        <Table.Row bg="bg.panel">
                                            <Table.ColumnHeader textAlign={"center"}>{t.supplier.supplier_name}</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {supplier?.map((supplier) => (
                                            <Table.Row key={supplier.supplier_id} cursor="pointer" _hover={{ bg: "gray.50" }} onClick={() => { onChoose(supplier); onClose();}}>
                                                <Table.Cell textAlign={"center"}>{supplier.supplier_name}</Table.Cell>
                                                <Table.Cell textAlign={"center"}>
                                                    <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} 
                                                        onClick={() => {
                                                            onChoose(supplier);
                                                            onClose();
                                                        }}
                                                    > {t.master.choose}</Button>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            )}
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
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