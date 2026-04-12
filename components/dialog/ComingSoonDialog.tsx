"use client";

import {
  Dialog,
  Portal,
  Button,
  Text,
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

interface ComingSoonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "en" | "id";
}

export default function ComingSoonDialog({
  isOpen,
  onClose,
  lang = "en",
}: ComingSoonDialogProps) {
  const t = getLang(lang);
  const d = t.coming_soon_dialog;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v.open && onClose()} size="sm">
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{d.title}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text color="gray.600" fontSize="sm">
                {d.description}
              </Text>
            </DialogBody>
            <DialogFooter>
              <Button bg="#E77A1F" color="white" onClick={onClose}>
                {d.close}
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
