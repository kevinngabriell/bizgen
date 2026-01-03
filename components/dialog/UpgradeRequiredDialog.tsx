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

interface UpgradeRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPackage: string;
  allowedPackages: string[];
}

export default function UpgradeRequiredDialog({
  isOpen,
  onClose,
  currentPackage,
  allowedPackages,
}: UpgradeRequiredDialogProps) {
  const allowedList = allowedPackages.map((p) => `${p}`).join(", ");

  return (
    <Dialog.Root open={isOpen} onOpenChange={(v) => !v.open && onClose()}>
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Akses Tidak Diizinkan</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={2}>
                Fitur ini hanya tersedia untuk pengguna dengan paket <b>{allowedList}</b>
              </Text>
              <Text mt={3}>
                Paket anda saat ini yaitu paket {" "}
                <b style={{ color: "red" }}>{currentPackage || "-"}</b> {"!!! "}
                Silakan upgrade paket Anda untuk mengakses fitur ini.
              </Text>
            </DialogBody>
            <DialogFooter>
              <Button onClick={onClose}>Tutup</Button>
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