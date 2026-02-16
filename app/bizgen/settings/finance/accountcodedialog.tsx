"use client";

import { getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Dialog, Portal, Field, Input, Button, SimpleGrid, CloseButton, Select, createListCollection } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface AccountCodeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  placeholders?: {
    account_code_id?: string;
    account_code?: string;
    account_code_name?: string;
    account_code_name_alias?: string;
    account_type?: string;
    parent_account_code_id?: string;
    is_active?: boolean;
  };
  onSubmit?: (data: {
    account_code_id?: string;
    account_code: string;
    account_code_name: string;
    account_code_name_alias?: string;
    account_type: string;
    parent_account_code_id?: string;
    is_active: boolean;
  }) => void;
}

export default function AccountCodeDialog({title, isOpen, setIsOpen, placeholders, onSubmit,
}: AccountCodeDialogProps) {
  const [accountCodeID, setAccountCodeID] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [accoutCodeName, setAccountCodeName] = useState("");
  const [accountCodeNameAlias, setAccountCodeNameAlias] = useState("");
  const [accountType, setAccountType] = useState("");
  const [parentAccountCodeID, setParentAccountCodeID] = useState("");

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
   const t = getLang(lang);

  const init = async () => {
    //get info from authentication
    const info = getAuthInfo();

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);
  }

  const accountTypeCollection = createListCollection({
    items: [
      { label: "Asset", value: "asset" },
      { label: "Liability", value: "liability" },
      { label: "Equity", value: "equity" },
      { label: "Revenue", value: "revenue" },
      { label: "Expense", value: "expense" },
    ],
  });

  useEffect(() => {
    if(!isOpen) return;

    init();

    setAccountCodeID(placeholders?.account_code_id ?? "");
    setAccountCode(placeholders?.account_code ?? "");
    setAccountCodeName(placeholders?.account_code_name ?? "");
    setAccountCodeNameAlias(placeholders?.account_code_name_alias ?? "");
    setAccountType(placeholders?.account_type ?? "");
    setParentAccountCodeID(placeholders?.parent_account_code_id ?? "");

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
                <Field.Root required>
                  <Field.Label>{t.account_code.account_code} <Field.RequiredIndicator/> </Field.Label>
                  <Input placeholder={t.account_code.account_code_placeholder} value={accountCode} onChange={(e) => setAccountCode(e.target.value)}/>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t.account_code.account_code_name} <Field.RequiredIndicator/> </Field.Label>
                  <Input placeholder={t.account_code.account_code_name_placeholder} value={accoutCodeName}  onChange={(e) => setAccountCodeName(e.target.value)}/>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.account_code.account_code_name_alias}</Field.Label>
                  <Input placeholder={t.account_code.account_code_name_alias_placeholder} value={accountCodeNameAlias} onChange={(e) => setAccountCodeNameAlias(e.target.value)}/>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t.account_code.account_type}<Field.RequiredIndicator /></Field.Label>
                  <Select.Root collection={accountTypeCollection} value={accountType ? [accountType] : []}
                    onValueChange={(details) => setAccountType(details.value[0])} size="sm" width="100%">
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder={t.account_code.account_type_placeholder} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {accountTypeCollection.items.map((type) => (
                            <Select.Item item={type} key={type.value}>
                              {type.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </SimpleGrid>
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">{t.delete_popup.cancel}</Button>
              </Dialog.ActionTrigger>
              <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}  onClick={() =>
                  onSubmit?.({
                    account_code_id: accountCodeID,
                    account_code: accountCode,
                    account_code_name: accoutCodeName,
                    account_code_name_alias: accountCodeNameAlias,
                    account_type: accountType,
                    parent_account_code_id: parentAccountCodeID,
                    is_active: true,
                  })
                }>{t.master.save}</Button>
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