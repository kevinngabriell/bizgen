"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getSalesdeliveryOrder, GetSalesDeliveryItemData } from "@/lib/sales/delivery-order";
import { Dialog, Portal, Field, InputGroup, Input, Button, CloseButton, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Loading from "../loading";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (delivery_order: GetSalesDeliveryItemData) => void;
};

export default function DeliveryOrderLookup({ isOpen, onClose, onChoose }: Props) {
  const [deliveryOrders, setDeliveryOrders] = useState<GetSalesDeliveryItemData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const init = async () => {
    const info = getAuthInfo();
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);
  };

  const fetchDeliveryOrders = async (search?: string) => {
    try {
      setLoading(true);
      const { data } = await getSalesdeliveryOrder(1, 1000, search);
      setDeliveryOrders(data ?? []);
    } catch (err) {
      console.error(err);
      setDeliveryOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
    if (isOpen) {
      fetchDeliveryOrders();
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen) {
        fetchDeliveryOrders(search);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content minW="60vw">
            <Dialog.Header>
              <Dialog.Title>{t.lookup.delivery_order_title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root>
                <Field.Label>{t.lookup.search}</Field.Label>
                <InputGroup startElement={<LuSearch />} mb={5}>
                  <Input placeholder={t.lookup.delivery_order_search_placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
                </InputGroup>
              </Field.Root>

              {loading ? (
                <Loading />
              ) : deliveryOrders.length === 0 ? (
                <Text>{t.lookup.no_delivery_order}</Text>
              ) : (
                <Table.Root>
                  <Table.Header>
                    <Table.Row bg="bg.panel">
                      <Table.ColumnHeader textAlign="center">{t.lookup.delivery_order_no}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.lookup.delivery_order_date}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {deliveryOrders.map((item) => (
                      <Table.Row
                        key={item.delivery_order_id}
                        cursor="pointer"
                        _hover={{ bg: "gray.50" }}
                        onClick={() => { onChoose(item); onClose(); }}
                      >
                        <Table.Cell textAlign="center">{item.do_number}</Table.Cell>
                        <Table.Cell textAlign="center">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString(
                                lang === "id" ? "id-ID" : "en-US",
                                { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
                              )
                            : "-"}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Button size="sm" bg="#E77A1F" color="white" onClick={() => { onChoose(item); onClose(); }}>
                            {t.master.choose}
                          </Button>
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
