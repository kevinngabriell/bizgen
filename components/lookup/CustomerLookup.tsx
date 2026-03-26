"use client";

import { getAllCustomer, GetCustomerData } from "@/lib/master/customer";
import { Button, CloseButton, Dialog, Input, InputGroup, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Loading from "../loading";
import { getLang } from "@/lib/i18n";
import { getAuthInfo } from "@/lib/auth/auth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (customer: GetCustomerData) => void;
};

export default function CustomerLookup({
    isOpen, onClose, onChoose,
}: Props) {
    const [customers, setCustomers] = useState<GetCustomerData[]>([]);
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

    const fetchCustomers = async (search?: string) => {
        try {
            setLoading(true);
            const customerRes = await getAllCustomer(1, 1000, search);
            setCustomers(customerRes?.data ?? []);
        } catch (err) {
            console.error(err);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        init();

        if (isOpen) {
            fetchCustomers();
        }
    }, [isOpen]);

    useEffect(() => {
        const delay = setTimeout(() => {
        if (isOpen) {
            fetchCustomers(search);
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
                            <Dialog.Title>{t.customer.choose_customer}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <InputGroup startElement={<LuSearch/>} mb={5}>
                                <Input placeholder={t.customer.customer_name_placeholder} value={search} onChange={(e) => setSearch(e.target.value)}/>
                            </InputGroup>

                            {loading ? (
                                <Loading/>
                            ) : customers.length === 0 ? (
                                <Text>{t.customer.no_customer_found}</Text>
                            ) : (
                                <Table.Root>
                                    <Table.Header>
                                        <Table.Row bg="bg.panel">
                                            <Table.ColumnHeader textAlign={"center"}>{t.customer.customer_name}</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign={"center"}>{t.customer.customer_phone}</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign={"center"}>{t.customer.customer_pic}</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign={"center"}>{t.master.action}</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {customers?.map((customer) => (
                                            <Table.Row key={customer.customer_id} cursor="pointer" _hover={{ bg: "gray.50" }} onClick={() => { onChoose(customer); onClose();}}>
                                                <Table.Cell textAlign={"center"}>{customer.customer_name}</Table.Cell>
                                                <Table.Cell textAlign={"center"}>{customer.customer_phone}</Table.Cell>
                                                <Table.Cell textAlign={"center"}>{customer.customer_pic_name}</Table.Cell>
                                                <Table.Cell textAlign={"center"}>
                                                    <Button size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"} 
                                                        onClick={() => {
                                                            onChoose(customer);
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
                                <Button variant="outline">{t.master.cancel}</Button>
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