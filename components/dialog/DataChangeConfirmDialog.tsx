"use client";

import {
  Dialog,
  Portal,
  Button,
  Text,
  Table,
  Badge,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogContent,
  DialogPositioner,
  DialogBackdrop,
  CloseButton,
} from "@chakra-ui/react";
import { getLang } from "@/lib/i18n";

export interface ItemChangeRow {
  rowIndex: number;
  description: { original: string; modified: string; changed: boolean };
  qty: { original: number; modified: number; changed: boolean };
  uomName: { original: string; modified: string; changed: boolean };
}

interface DataChangeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: ItemChangeRow[];
  loading?: boolean;
  lang?: "en" | "id";
}

export default function DataChangeConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  changes,
  loading = false,
  lang = "en",
}: DataChangeConfirmDialogProps) {
  const t = getLang(lang);
  const d = t.data_change_confirm_dialog;

  const changedItems = changes.filter(
    (c) => c.description.changed || c.qty.changed || c.uomName.changed
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v.open && onClose()} size="xl">
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxW="750px">
            <DialogHeader>
              <DialogTitle>{d.title}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4} color="gray.600" fontSize="sm">
                {d.description}
              </Text>

              {changedItems.length === 0 ? (
                <Text color="gray.500" fontSize="sm">
                  {d.no_changes}
                </Text>
              ) : (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader w="40px">#</Table.ColumnHeader>
                      <Table.ColumnHeader>{d.field_label}</Table.ColumnHeader>
                      <Table.ColumnHeader>{d.original_label}</Table.ColumnHeader>
                      <Table.ColumnHeader>{d.your_changes_label}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {changedItems.flatMap((item) => {
                      const rows = [];

                      if (item.description.changed) {
                        rows.push(
                          <Table.Row key={`${item.rowIndex}-desc`}>
                            <Table.Cell>{item.rowIndex + 1}</Table.Cell>
                            <Table.Cell color="gray.500" fontSize="xs">
                              {d.description_label}
                            </Table.Cell>
                            <Table.Cell>{item.description.original || "-"}</Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette="orange" variant="subtle">
                                {item.description.modified || "-"}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      }

                      if (item.qty.changed) {
                        rows.push(
                          <Table.Row key={`${item.rowIndex}-qty`}>
                            <Table.Cell>{item.rowIndex + 1}</Table.Cell>
                            <Table.Cell color="gray.500" fontSize="xs">
                              {d.quantity_label}
                            </Table.Cell>
                            <Table.Cell>{item.qty.original}</Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette="orange" variant="subtle">
                                {item.qty.modified}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      }

                      if (item.uomName.changed) {
                        rows.push(
                          <Table.Row key={`${item.rowIndex}-uom`}>
                            <Table.Cell>{item.rowIndex + 1}</Table.Cell>
                            <Table.Cell color="gray.500" fontSize="xs">
                              {d.uom_label}
                            </Table.Cell>
                            <Table.Cell>{item.uomName.original || "-"}</Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette="orange" variant="subtle">
                                {item.uomName.modified || "-"}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      }

                      return rows;
                    })}
                  </Table.Body>
                </Table.Root>
              )}
            </DialogBody>
            <DialogFooter gap={3}>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {d.cancel}
              </Button>
              <Button
                bg="#E77A1F"
                color="white"
                onClick={onConfirm}
                loading={loading}
              >
                {d.proceed}
              </Button>
            </DialogFooter>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </Dialog.Root>
  );
}
