"use client";

import { GetRfq, getSalesRfq } from "@/lib/sales/rfq";
import { Button, CloseButton, Dialog, Field, Input, InputGroup, Portal, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Loading from "../loading";
import { getLang } from "@/lib/i18n";
import { getAuthInfo } from "@/lib/auth/auth";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (rfq: GetRfq) => void;
};

export default function InquiryLookup({
  isOpen,
  onClose,
  onChoose,
}: Props) {
  const [rfq, setRFQ] = useState<GetRfq[]>([]);
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

  const fetchInquiry = async (search?: string) => {
    try {
      setLoading(true);
      const { data } = await getSalesRfq(1, 1000, search);
      setRFQ(data ?? []);
    } catch (err) {
      console.error(err);
      setRFQ([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();

    if (isOpen) {
      fetchInquiry();
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen) {
        fetchInquiry(search);
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
              <Dialog.Title>{t.lookup.inquiry_title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root>
                <Field.Label>{t.lookup.search}</Field.Label>
                <InputGroup startElement={<LuSearch />} mb={5}>
                  <Input placeholder={t.lookup.inquiry_search_placeholder} value={search} onChange={(e) => setSearch(e.target.value)}/>
                </InputGroup>
              </Field.Root>
              

              {loading ? (
                <Loading />
              ) : rfq.length === 0 ? (
                <Text>{t.lookup.no_inquiry}</Text>
              ) : (
                <Table.Root>
                  <Table.Header>
                    <Table.Row bg="bg.panel">
                      <Table.ColumnHeader textAlign="center">{t.lookup.inquiry_no}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.lookup.inquiry_customer}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.lookup.inquiry_date}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">{t.master.action}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rfq.map((item) => (
                      <Table.Row key={item.sales_rfq_id} cursor="pointer" _hover={{ bg: "gray.50" }}
                        onClick={() => {
                          onChoose(item);
                          onClose();
                        }}
                      >
                        <Table.Cell textAlign="center">{item.sales_rfq_number}</Table.Cell>
                        <Table.Cell textAlign="center">{item.customer_name}</Table.Cell>
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