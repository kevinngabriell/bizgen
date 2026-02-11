'use client';

import {Button, Flex, Heading, Input, Text, Textarea, Separator, Card, SimpleGrid, Field, createListCollection, Select, Portal} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import Loading from '@/components/loading';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { GetAccountCodeData, getAllAccountCode } from '@/lib/master/account-code';
import { getAllCurrency, GetCurrencyData } from '@/lib/master/currency';

export default function CreateIncomePage() {
  const router = useRouter();

  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

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
    accountCode: '',
    incomeDate: '',
    amount: '',
    currency: 'IDR',
    description: '',
    referenceNo: '',
    customer: '',
  });

  const onChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.accountCode || !form.amount || !form.incomeDate) {
      return;
    }

    // TODO: connect to API
    console.log('Submitting income payload:', form);

    router.back();
  };

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir={"column"}>
          <Heading size="lg">Create Income</Heading>
          <Text color="gray.500" mt={1}>Record incoming company revenue with account code mapping.</Text>
        </Flex>

        <Flex gap={5}>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button colorScheme="green" onClick={handleSubmit}>Save Income</Button>
        </Flex>
      </Flex>

      <Card.Root>
        <Card.Body gap={"20px"}>
          <Field.Root required>
            <Field.Label>Account Code</Field.Label>
            <Field.HelperText>Determines how this income is categorized in your chart of accounts.</Field.HelperText>
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
          <SimpleGrid columns={{base: 1, md: 2, lg:3}} gap={"20px"}>
            <Field.Root required>
              <Field.Label>Income Date</Field.Label>
              <Input type="date" value={form.incomeDate} onChange={e => onChange('incomeDate', e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>Amount</Field.Label>
              <Input type="number" placeholder="0" value={form.amount} onChange={e => onChange('amount', e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>Currency</Field.Label>
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
          </SimpleGrid>
          <Separator/>
          <SimpleGrid columns={{base: 1, md: 2}} gap={"20px"}>
            <Field.Root>
              <Field.Label>Customer / Payer (optional)</Field.Label>
              <Input placeholder="Enter customer or payer name" value={form.customer}onChange={e => onChange('customer', e.target.value)}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Reference No. (optional)</Field.Label>
              <Input placeholder="Invoice / Receipt reference" value={form.referenceNo} onChange={e => onChange('referenceNo', e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Field.Root>
            <Field.Label>Description / Notes</Field.Label>
            <Textarea rows={3} placeholder="Add additional details (e.g., payment source, remarks)" value={form.description} onChange={e => onChange('description', e.target.value)}/>
          </Field.Root>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}
