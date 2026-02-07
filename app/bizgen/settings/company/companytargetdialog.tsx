"use client";

import { Dialog, Portal, Field,
  Input,
  Button,
  SimpleGrid,
  CloseButton,
  NumberInput,
} from "@chakra-ui/react";
import { ReactNode } from "react";

interface CompanyTargetDialogProps {
    triggerIcon: ReactNode;
    title: string;
    placeholders?: {
        year?: Int32Array;
        target?: Int32Array;
    };
    onSubmit?: () => void;
}

export default function CompanyTargetDialog({
    triggerIcon,
    title,
    placeholders,
    onSubmit,
}: CompanyTargetDialogProps) {
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
                            <SimpleGrid columns={{base: 1, md: 1, lg: 2}} gap="20px">
                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Year</Field.Label>
                                    <NumberInput.Root>
                                        <NumberInput.Control />
                                        <NumberInput.Input />
                                    </NumberInput.Root>
                                </Field.Root>

                                <Field.Root w={{base: "100%", md: "100%", lg: "100%"}}>
                                    <Field.Label>Nominal</Field.Label>
                                    <NumberInput.Root>
                                        <NumberInput.Control />
                                        <NumberInput.Input />
                                    </NumberInput.Root>
                                </Field.Root>
                            </SimpleGrid>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline" borderColor={"#E77A1F"}>Batal</Button>
                            </Dialog.ActionTrigger>
                            <Button onClick={onSubmit} bg={"#E77A1F"}>Simpan</Button>
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