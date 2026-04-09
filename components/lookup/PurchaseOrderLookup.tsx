"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getPurchaseLocal, GetPurchaseLocalData } from "@/lib/purchase/local";
import { getPurchaseImport, GetPurchaseImportData } from "@/lib/purchase/import";
import {
  Badge,
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  InputGroup,
  Portal,
  Table,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import Loading from "../loading";

export type PurchaseOrderEntry =
  | (GetPurchaseLocalData & { purchase_type: "local" })
  | (GetPurchaseImportData & { purchase_type: "import" });

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (entry: PurchaseOrderEntry) => void;
};

const BIZGEN_COLOR = "#E77A1F";

export default function PurchaseOrderLookup({ isOpen, onClose, onChoose }: Props) {
  const [allEntries, setAllEntries] = useState<PurchaseOrderEntry[]>([]);
  const [filtered, setFiltered] = useState<PurchaseOrderEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const init = async () => {
    const info = getAuthInfo();
    setLang(info?.language === "id" ? "id" : "en");
  };

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [localRes, importRes] = await Promise.all([
        getPurchaseLocal(1, 1000),
        getPurchaseImport(1, 1000),
      ]);

      const localEntries: PurchaseOrderEntry[] = (localRes.data ?? []).map((d) => ({
        ...d,
        purchase_type: "local" as const,
      }));

      const importEntries: PurchaseOrderEntry[] = (importRes.data ?? []).map((d) => ({
        ...d,
        purchase_type: "import" as const,
      }));

      const combined = [...localEntries, ...importEntries];
      setAllEntries(combined);
      setFiltered(combined);
    } catch (err) {
      console.error(err);
      setAllEntries([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
    if (isOpen) {
      setSearch("");
      fetchAll();
    }
  }, [isOpen]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? allEntries.filter((e) => e.po_number.toLowerCase().includes(q))
        : allEntries
    );
  }, [search, allEntries]);

  const getId = (entry: PurchaseOrderEntry) =>
    entry.purchase_type === "local"
      ? (entry as GetPurchaseLocalData & { purchase_type: "local" }).purchase_id
      : (entry as GetPurchaseImportData & { purchase_type: "import" }).purchase_id;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content minW={"60vw"}>
            <Dialog.Header>
              <Dialog.Title>
                {lang === "id" ? "Cari Purchase Order" : "Purchase Order Lookup"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root>
                <Field.Label>
                  {lang === "id" ? "Cari" : "Search"}
                </Field.Label>
                <InputGroup startElement={<LuSearch />} mb={5}>
                  <Input
                    placeholder={lang === "id" ? "Cari nomor PO..." : "Search PO number..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Field.Root>

              {loading ? (
                <Loading />
              ) : filtered.length === 0 ? (
                <Text>{lang === "id" ? "Tidak ada purchase order ditemukan." : "No purchase orders found."}</Text>
              ) : (
                <Table.Root>
                  <Table.Header>
                    <Table.Row bg="bg.panel">
                      <Table.ColumnHeader textAlign="center">
                        {lang === "id" ? "No. PO" : "PO Number"}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">
                        {lang === "id" ? "Tanggal PO" : "PO Date"}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">
                        {lang === "id" ? "Tipe" : "Type"}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">
                        {t.master.action}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filtered.map((entry) => (
                      <Table.Row
                        key={`${entry.purchase_type}-${getId(entry)}`}
                        cursor="pointer"
                        _hover={{ bg: "gray.50" }}
                        onClick={() => { onChoose(entry); onClose(); }}
                      >
                        <Table.Cell textAlign="center">{entry.po_number}</Table.Cell>
                        <Table.Cell textAlign="center">{entry.po_date ?? "—"}</Table.Cell>
                        <Table.Cell textAlign="center">
                          <Badge colorPalette={entry.purchase_type === "local" ? "blue" : "orange"}>
                            {entry.purchase_type === "local" ? "Local" : "Import"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Button
                            size="sm"
                            bg={BIZGEN_COLOR}
                            color="white"
                            onClick={() => { onChoose(entry); onClose(); }}
                          >
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
