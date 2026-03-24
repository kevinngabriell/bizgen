"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getSalesOrder, GetSalesOrderItemData } from "@/lib/sales/sales-order";
import { Dialog, Portal, Field, InputGroup, Input, Button, CloseButton, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Loading from "../loading";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (sales_order: GetSalesOrderItemData) => void;
};

export default function SalesOrderLookup({  
    isOpen,
    onClose,
    onChoose,}: Props) {
      const [salesOrder, setSalesOrder] = useState<GetSalesOrderItemData[]>([]);
      const [search, setSearch] = useState("");
      const [loading, setLoading] = useState(false);

    // language state
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);
      
    const init = async () => {
        const info = getAuthInfo();
        const language = info?.language === "id" ? "id" : "en";
        setLang(language);
    };

  const fetchSalesOrder = async (search?: string) => {
    try {
      setLoading(true);
      const { data } = await getSalesOrder(1, 1000, search);
      setSalesOrder(data ?? []);
    } catch (err) {
      console.error(err);
      setSalesOrder([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();

    if (isOpen) {
      fetchSalesOrder();
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen) {
        fetchSalesOrder(search);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);
      
  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content minW={"60vw"}>
            <Dialog.Header>
              <Dialog.Title>{t.sales_quotation.linked_inquiry}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root>
                <Field.Label>Search</Field.Label>
                <InputGroup startElement={<LuSearch />} mb={5}>
                  <Input placeholder={t.sales_quotation.linked_inquiry_placeholder} value={search} onChange={(e) => setSearch(e.target.value)}/>
                </InputGroup>
              </Field.Root>
              

              {loading ? (
                <Loading />
              ) : salesOrder.length === 0 ? (
                <Text>No inquiry found</Text>
              ) : (
                <Table.Root>
                  <Table.Header>
                    <Table.Row bg="bg.panel">
                      <Table.ColumnHeader textAlign="center">Nomor Sales Order</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Customer</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Date</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {salesOrder.map((item) => (
                      <Table.Row key={item.sales_order_id} cursor="pointer" _hover={{ bg: "gray.50" }}
                        onClick={() => {
                          onChoose(item);
                          onClose();
                        }}
                      >
                        <Table.Cell textAlign="center">{item.sales_order_no}</Table.Cell>
                        <Table.Cell textAlign="center">{item.sales_order_no}</Table.Cell>
                        <Table.Cell textAlign="center">{item.created_at ? new Date(item.created_at).toLocaleString(
                            lang === "id" ? "id-ID" : "en-US",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            }
                          )
                        : "-"}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Button size="sm" bg={"#E77A1F"} color={"white"} onClick={() => {onChoose(item);onClose();}}>{t.master.choose}</Button>
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