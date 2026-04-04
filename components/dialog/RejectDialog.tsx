"use client";

import {
  Dialog,
  Portal,
  Button,
  Text,
  Textarea,
  Field,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogContent,
  DialogPositioner,
  DialogBackdrop,
  CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { getLang } from "@/lib/i18n";

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
  lang?: "en" | "id";
}

export default function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  lang = "en",
}: RejectDialogProps) {
  const t = getLang(lang);
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v.open && handleClose()}>
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.reject_dialog.title}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>{t.reject_dialog.description}</Text>
              <Field.Root required>
                <Field.Label>
                  {t.reject_dialog.reason_label} <Field.RequiredIndicator />
                </Field.Label>
                <Textarea
                  placeholder={t.reject_dialog.reason_placeholder}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </Field.Root>
            </DialogBody>
            <DialogFooter gap={3}>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                {t.reject_dialog.cancel}
              </Button>
              <Button
                colorPalette="red"
                onClick={handleConfirm}
                disabled={!reason.trim() || loading}
                loading={loading}
              >
                {t.reject_dialog.confirm}
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
