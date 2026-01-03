"use client";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton} from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";

interface AccountCodeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  placeholders?: {
    kodeAkun?: string;
    namaAkun?: string;
    aliasAkun?: string;
  };
  onSubmit?: (data: {
    code: string;
    account_name: string;
    account_name_alias: string;
  }) => void;
}

export default function AccountCodeDialog({
  title,
  isOpen,
  setIsOpen,
  placeholders,
  onSubmit,
}: AccountCodeDialogProps) {
  const [kodeAkun, setKodeAkun] = useState("");
  const [namaAkun, setNamaAkun] = useState("");
  const [aliasAkun, setAliasAkun] = useState("");


  useEffect(() => {
    if (placeholders) {
      setKodeAkun(placeholders.kodeAkun ?? "");
      setNamaAkun(placeholders.namaAkun ?? "");
      setAliasAkun(placeholders.aliasAkun ?? "");
    }
  }, [placeholders, isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(details) => setIsOpen(details.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <SimpleGrid columns={{ base: 1, md: 1, lg: 1 }} gap="20px">
                <Field.Root>
                  <Field.Label>Kode Akun</Field.Label>
                  <Input 
                    placeholder={placeholders?.kodeAkun ?? "Masukkan kode akun"}
                    value={kodeAkun} 
                    onChange={(e) => setKodeAkun(e.target.value)}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Nama Kode Akun</Field.Label>
                  <Input 
                    placeholder={placeholders?.namaAkun ?? "Masukkan nama kode akun"} 
                    value={namaAkun} 
                    onChange={(e) => setNamaAkun(e.target.value)}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Nama Kode Akun Alias</Field.Label>
                  <Input 
                    placeholder={placeholders?.aliasAkun ?? "Masukkan nama kode akun alias"} 
                    value={aliasAkun} 
                    onChange={(e) => setAliasAkun(e.target.value)}
                  />
                </Field.Root>
              </SimpleGrid>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Batal</Button>
              </Dialog.ActionTrigger>
              <Button onClick={() =>
                  onSubmit?.({
                    code: kodeAkun,
                    account_name: namaAkun,
                    account_name_alias: aliasAkun
                  })
                }>Simpan</Button>
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