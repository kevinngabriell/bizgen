"use client";
import {
  Dialog,
  Portal,
  Field,
  Input,
  Button,
  SimpleGrid,
  CloseButton,
  InputGroup,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";

interface TaxDialogProps {
  triggerIcon: ReactNode;
  title: string;
  placeholders?: {
    tax?: string;
    taxCount?: string;
  };
  onSubmit?: (data: {
    tax_name: string;
    tax_percentage: number;
  }) => void;
}

export default function TaxDialog({
    triggerIcon,
    title,
    placeholders,
    onSubmit,
}: TaxDialogProps) {
    const [taxName, setTaxName] = useState("");
    const [taxPercentage, setTaxPercentage] = useState<number>(0);

    return(
        <Dialog.Root>
            <Dialog.Trigger asChild>{triggerIcon}</Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{title}</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <SimpleGrid columns={{ base: 1, md: 1, lg: 1 }} gap="20px">
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Tax</Field.Label>
                                    <Input value={taxName} 
                                        onChange={(e) => setTaxName(e.target.value)}  placeholder={placeholders?.tax ?? "Masukkan nama pajak"} />
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Tax Count</Field.Label>
                                    <InputGroup endElement="%">
                                        <Input type="number" step="0.01" value={taxPercentage}
  onChange={(e) => setTaxPercentage(parseFloat(e.target.value))}  placeholder={placeholders?.taxCount ?? "Masukkan jumlah pajak"} />
                                    </InputGroup>
                                </Field.Root>                         
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button onClick={() =>
                            onSubmit?.({
                                tax_name: taxName,
                                tax_percentage: taxPercentage
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