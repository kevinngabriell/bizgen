"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { GetAccountCodeData, getAllAccountCode } from "@/lib/master/account-code";
import { getAllCurrency, GetCurrencyData } from "@/lib/master/currency";
import { Button, Card, Flex, Field, Input, Text, Textarea, Heading, SimpleGrid, createListCollection, Select, Portal } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CreateExpensePage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [accountCodeSelected, setAccountCodeSelected] = useState<string>();
  const [accountCodeOptions, setAccountCodeOptions] = useState<GetAccountCodeData[]>([]);
  const [currencySelected, setCurrencySelected] = useState<string>();
  const [currencyOptions, setCurrencyOptions] = useState<GetCurrencyData[]>([]);

  const t = getLang("en"); 

  const accountcodeCollection = createListCollection({
    items: accountCodeOptions.map((acc) => ({
      label: `${acc.account_code} - ${acc.account_code_name}`,
      value: acc.account_code_id,
    })),
  });

  const currencyCollection = createListCollection({
    items: currencyOptions.map((currency) => ({
      label: `${currency.currency_name} (${currency.currency_symbol})`,
      value: currency.currency_id,
    })),
  });

  useEffect(() => {
    const fetchAccountCode = async () => {
      try {
        setLoading(true);
        const accountRes = await getAllAccountCode(1, 1000);
        setAccountCodeOptions(accountRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setAccountCodeOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrency = async () => {
      try {
        setLoading(true);
        const currencyRes = await getAllCurrency(1, 1000);
        setCurrencyOptions(currencyRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setCurrencyOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountCode();
    fetchCurrency();

    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    try {

    } catch (error: any){

    } finally {
      setLoading(false);
    }
  }
    
  if (loading) return <Loading/>;
  
  const [form, setForm] = useState({
    expenseDate: "",
    accountCode: "",
    amount: "",
    currency: "IDR",
    vendor: "",
    referenceNo: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {

  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex flexDir={"column"}>
        <Heading>Create Expense</Heading>
        <Text fontSize="sm" color="gray.500">Record an operational expense and map it to an account code.</Text>
      </Flex>

      <Card.Root mt={6}>
        <Card.Header pb={0}>
           <Text fontWeight="semibold">Expense Details</Text>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2}} gap={"20px"}>
            <Field.Root>
              <Field.Label>Date</Field.Label>
              <Input type="date" name="expenseDate" value={form.expenseDate} onChange={handleChange}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.account_code.account_code}</Field.Label>
              <Select.Root collection={accountcodeCollection} value={accountCodeSelected ? [accountCodeSelected] : []} onValueChange={(details) => setAccountCodeSelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.bank_account.select_currency_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {accountcodeCollection.items.map((acc) => (
                        <Select.Item item={acc} key={acc.value}>
                          {acc.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
            </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Amount</Field.Label>
              <Input type="number" name="amount" placeholder="0" value={form.amount} onChange={handleChange}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.currency.currency_name}</Field.Label>
              <Select.Root collection={currencyCollection} value={currencySelected ? [currencySelected] : []} onValueChange={(details) => setCurrencySelected(details.value[0])} size="sm" width="100%">
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={t.bank_account.select_currency_placeholder} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {currencyCollection.items.map((currency) => (
                        <Select.Item item={currency} key={currency.value}>
                          {currency.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
            </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Vendor / Payee</Field.Label>
              <Input name="vendor" placeholder="Vendor name" value={form.vendor} onChange={handleChange}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Reference No.</Field.Label>
              <Input name="referenceNo" placeholder="Invoice / Receipt No." value={form.referenceNo} onChange={handleChange}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root mt={5}>
            <Field.Label>Description / Notes</Field.Label>
            <Textarea name="description" placeholder="Additional details about this expense" value={form.description} onChange={handleChange}/>
          </Field.Root>

          <Flex justify="flex-end" mt={5}>
            <Button variant="ghost">{t.delete_popup.cancel}</Button>
            <Button colorScheme="purple" onClick={handleSubmit}>Save Expense</Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
  );
}