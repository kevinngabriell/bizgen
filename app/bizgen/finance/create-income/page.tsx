'use client';

import {Button, Flex, Heading, Input, Text, Textarea, Separator, Card, SimpleGrid, Field, createListCollection, Select, Portal, InputGroup, Combobox, useFilter, useListCollection} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import Loading from '@/components/loading';
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from '@/lib/auth/auth';
import { getLang } from '@/lib/i18n';
import { GetAccountCodeData, getAllAccountCode } from '@/lib/master/account-code';
import { getAllBankAccount, GetBankAccountData } from '@/lib/master/bank-account';
import { createFinanceTransaction } from '@/lib/finance/finance';
import { AlertMessage } from '@/components/ui/alert';

export default function CreateIncomePage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  //alert & success variable
  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [bankAccountSelected, setBankAccount] = useState<string>();
  const [bankAccountOptions, setBankAccountOptions] = useState<GetBankAccountData[]>([]);

  const [accountCodeCollections, setAccountCodeCollections] = useState<GetAccountCodeData[]>([]);
  const { contains } = useFilter({ sensitivity: "base" })

  const { collection: accountCollection, set: setAccountCollection } = useListCollection<GetAccountCodeData>({
    initialItems: [],
    itemToString: (item) => `${item.account_code} - ${item.account_code_name}`,
    itemToValue: (item) => item.account_code_id,
  })

  const bankAccountCollection = createListCollection({
    items: bankAccountOptions.map((bank) => ({
      label: `${bank.bank_number} - ${bank.bank_name} (${bank.currency_symbol})`,
      value: bank.bank_account_id,
    })),
  });

  const selectedBank = bankAccountOptions.find(
    (b) => b.bank_account_id === bankAccountSelected
  );

  const currencySymbol = selectedBank?.currency_symbol ?? '';

  const formatNumber = (value: string) => {
    if (!value) return '';

    const cleaned = value.replace(/,/g, '');

    if (cleaned === '' || cleaned === '.') return cleaned;

    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const formattedInt = Number(integerPart || 0).toLocaleString('en-US');

    return decimalPart !== undefined ? `${formattedInt}.${decimalPart}` : formattedInt;
  };

  const parseNumber = (value: string) => {
    // remove commas
    let cleaned = value.replace(/,/g, '');

    // allow only numbers and decimal point
    cleaned = cleaned.replace(/[^0-9.]/g, '');

    // prevent multiple decimals
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // limit to 2 decimal digits
    const [integerPart, decimalPart] = cleaned.split('.');
    if (decimalPart !== undefined) {
      cleaned = `${integerPart}.${decimalPart.slice(0, 2)}`;
    }

    return cleaned;
  };

  const handleAmountInput = (value: string) => {
    const parsed = parseNumber(value);

    // ensure valid numeric format with max 2 decimals
    const validPattern = /^\d*(\.\d{0,2})?$/;

    if (parsed === '' || validPattern.test(parsed)) {
      return parsed;
    }

    return '';
  };

  useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        setLoading(true);
        const bankRes = await getAllBankAccount(1, 1000);
        setBankAccountOptions(bankRes?.data ?? []);
      } catch (error) {
        console.error(error);
        setBankAccountOptions([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch account codes for combobox
    const fetchAccountCodes = async () => {
      try {
        setLoading(true);
        const accRes = await getAllAccountCode(1, 1000);
        const accData = accRes?.data ?? [];
        setAccountCodeCollections(accData);
        setAccountCollection(accData);
      } catch (error) {
        console.error(error);
        setAccountCodeCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccount();
    fetchAccountCodes();

    init();
  }, []);

  const init = async () => {
    setLoading(true);

    //check authentication redirect
    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    //get info from authentication
    const info = getAuthInfo();
    setAuth(info);

    //set language from token authentication
    const language = info?.language === "id" ? "id" : "en";
    setLang(language);

    setLoading(false);
  };
  
  const [form, setForm] = useState({
    accountCode: '',
    incomeDate: '',
    amount: '',
    currency: 'IDR',
    description: '',
    referenceNo: '',
    customer: '',
  });

  const [lines, setLines] = useState([
    { id: crypto.randomUUID(), accountCodeId: '', accountCode: '', accountName: '', amount: '', memo: '' }
  ]);

  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: crypto.randomUUID(), accountCodeId: '', accountCode: '', accountName: '', amount: '', memo: '' }
    ]);
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, key: string, value: string) => {
    setLines(prev =>
      prev.map((line, i) =>
        i === index ? { ...line, [key]: value } : line
      )
    );
  };

  const totalLineAmount = lines.reduce((sum, line) => {
    const num = parseFloat(line.amount || '0');
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const isAmountMismatch = !!form.amount && Math.abs(totalLineAmount - parseFloat(form.amount || '0')) > 0.001;

  const onChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      if(!bankAccountSelected)
        throw new Error("Bank account is required");
      if(!form.incomeDate)
        throw new Error("Income date is required");
      if(!form.amount)
        throw new Error("Amount is required");
      if (lines.length === 0) 
        throw new Error("At least one item is required");

      setLoading(true);

      const payload = {
        category: "income",
        bank_account: bankAccountSelected,
        amount: form.amount,
        date: form.incomeDate,
        memo: form.description,
        details: lines.map((line) => ({
          account_code: line.accountCodeId,
          account_amount: line.amount,
          account_memo: line.memo
        }))
      }

      const res = await createFinanceTransaction(payload);
      
      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup("Success");
      setMessagePopup("Finance transaction created successfully");

      // reset form values
      setForm({
        accountCode: '',
        incomeDate: '',
        amount: '',
        currency: '',
        description: '',
        referenceNo: '',
        customer: '',
      });

      setBankAccount(undefined);

      // reset detail lines
      setLines([
        { id: crypto.randomUUID(), accountCodeId: '', accountCode: '', accountName: '', amount: '', memo: '' }
      ]);

      setTimeout(() => setShowAlert(false), 6000);

    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup("Error");
      setMessagePopup(err.message || "Failed to create finance transaction");
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading/>

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={6}>
        <Flex flexDir={"column"}>
          <Heading size="lg">Create Income</Heading>
          <Text color="gray.500" mt={1}>Record incoming company revenue with account code mapping.</Text>
        </Flex>

        <Flex gap={5}>
          <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => router.back()}>{t.delete_popup.cancel}</Button>
          <Button bg="#E77A1F" color="white" onClick={handleSubmit} disabled={isAmountMismatch} opacity={isAmountMismatch ? 0.6 : 1} cursor={isAmountMismatch ? "not-allowed" : "pointer"}>Save Income</Button>
        </Flex>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>}          
      
      {isAmountMismatch && (
        <AlertMessage title='Error' description='Total account lines tidak sama dengan amount' isSuccess={false}/>
      )}
      
      <Card.Root>
        <Card.Body gap={"20px"}>
          <Field.Root required>
            <Field.Label>Deposit To<Field.RequiredIndicator/></Field.Label>
              <Select.Root collection={bankAccountCollection} value={bankAccountSelected ? [bankAccountSelected] : []} onValueChange={(details) => setBankAccount(details.value[0])} size="sm" width="100%">
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
                      {bankAccountCollection.items.map((bank) => (
                        <Select.Item item={bank} key={bank.value}>
                          {bank.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
            </Select.Root>
          </Field.Root>
          <SimpleGrid columns={{base: 1, md: 2}} gap={"20px"}>
            <Field.Root required>
              <Field.Label>Date <Field.RequiredIndicator/></Field.Label>
              <Input type="date" value={form.incomeDate} onChange={e => onChange('incomeDate', e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>Amount <Field.RequiredIndicator/></Field.Label>
              <InputGroup startElement={currencySymbol || ""}>
                <Input type="text" placeholder={`0`} value={formatNumber(form.amount)} onChange={e => onChange('amount', handleAmountInput(e.target.value))}/>
              </InputGroup>
            </Field.Root>
          </SimpleGrid>
          <Field.Root required>
              <Field.Label>Memo</Field.Label>
              <Textarea placeholder='Masukkkan nomor memo' value={form.description} onChange={e => onChange('description', e.target.value)}/>
          </Field.Root>
          
          <Separator/>

          <Heading size="md">Account Details</Heading>

          {lines.map((line, index) => (
            <Flex key={line.id} direction="column" gap="10px">
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={"20px"}>
                <Field.Root required>
                  <Field.Label>Account Code<Field.RequiredIndicator/> </Field.Label>
                  <Combobox.Root key={`account-${line.id}`}
                    collection={accountCollection}
                    value={line.accountCodeId ? [line.accountCodeId] : []}
                    onValueChange={(details) => {
                      const selected = details.value?.[0];
                      const selectedAccount = accountCodeCollections.find(
                        (item) => item.account_code_id === selected
                      );

                      updateLine(index, 'accountCodeId', selected ?? '');
                      updateLine(index, 'accountCode', selectedAccount?.account_code ?? '');
                      updateLine(index, 'accountName', selectedAccount?.account_code_name ?? '');
                    }}
                    onInputValueChange={(e) => {
                      const input = e.inputValue ?? "";

                      if (!input || input.trim() === "") {
                        setAccountCollection(accountCodeCollections);
                        return;
                      }

                      const filtered = accountCodeCollections.filter((item) =>
                        contains(`${item.account_code} - ${item.account_code_name}`, input)
                      );

                      setAccountCollection(filtered);
                    }}
                  >
                    <Combobox.Control>
                      <Combobox.Input placeholder="Search account code" onFocus={() => setAccountCollection(accountCodeCollections)}/>
                      <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        <Combobox.Trigger />
                      </Combobox.IndicatorGroup>
                    </Combobox.Control>
                    <Portal>
                      <Combobox.Positioner>
                        <Combobox.Content>
                          <Combobox.Empty>No account found</Combobox.Empty>
                          {accountCollection.items.map((item) => (
                            <Combobox.Item item={item} key={item.account_code_id}>
                              {item.account_code} - {item.account_code_name}
                              <Combobox.ItemIndicator />
                            </Combobox.Item>
                          ))}
                        </Combobox.Content>
                      </Combobox.Positioner>
                    </Portal>
                  </Combobox.Root>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Account Name <Field.RequiredIndicator/></Field.Label>
                  <Input placeholder="Account name" value={line.accountName} readOnly/>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Amount <Field.RequiredIndicator/></Field.Label>
                  <InputGroup startElement={currencySymbol || ""}>
                    <Input type="text" placeholder={`0`} value={formatNumber(line.amount)} onChange={e => updateLine(index, 'amount', handleAmountInput(e.target.value))}/>
                  </InputGroup>
                  
                </Field.Root>
              </SimpleGrid>

              <Field.Root>
                <Field.Label>Memo</Field.Label>
                <Textarea placeholder="Memo" value={line.memo} onChange={e => updateLine(index, 'memo', e.target.value)}/>
              </Field.Root>
              
              <Button borderColor={"red"} color={"red"} variant="outline" onClick={() => removeLine(index)}>Delete</Button>
            </Flex>
          ))}


          <Button mt={4} variant="outline" borderColor="#E77A1F" color="#E77A1F" onClick={addLine}>+ Add Account</Button>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}
