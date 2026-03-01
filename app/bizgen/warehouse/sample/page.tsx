"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import {Button, Card, Flex, Field, Heading, Input, NumberInput, Textarea, SimpleGrid} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

export default function CreateSampleStockOutPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  useEffect(() => {
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
  }
    
  
  const [form, setForm] = useState({
    referenceNo: "",
    productName: "",
    requestedBy: "",
    purpose: "",
    notes: "",
    lots: [
      {
        lotNo: "",
        qty: 0,
        unit: "",
      },
    ],
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLotChange = (index: number, field: string, value: any) => {
    setForm((prev) => {
      const updatedLots = [...prev.lots];
      updatedLots[index] = {
        ...updatedLots[index],
        [field]: value,
      };
      return { ...prev, lots: updatedLots };
    });
  };

  const addLotRow = () => {
    setForm((prev) => ({
      ...prev,
      lots: [
        ...prev.lots,
        {
          lotNo: "",
          qty: 0,
          unit: "",
        },
      ],
    }));
  };

  const removeLotRow = (index: number) => {
    setForm((prev) => {
      const updatedLots = prev.lots.filter((_, i) => i !== index);
      return { ...prev, lots: updatedLots.length ? updatedLots : prev.lots };
    });
  };

  const handleSubmit = () => {
    // TODO: connect to API later
  };
  
  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Card.Root>
        <Card.Header>
          <Heading size="md">{t.warehouse.stock_sample.createSampleStockOut}</Heading>
        </Card.Header>

        <Card.Body>
          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={5}>
            <Field.Root>
              <Field.Label>{t.warehouse.stock_sample.referenceNo}</Field.Label>
              <Input placeholder={t.warehouse.stock_sample.autoOptional} value={form.referenceNo} onChange={(e) => handleChange("referenceNo", e.target.value)}/>
            </Field.Root>
            <Field.Root required>
              <Field.Label>{t.warehouse.stock_sample.productName} <Field.RequiredIndicator/></Field.Label>
              <Input placeholder={t.warehouse.stock_sample.typeOrSelectProduct} value={form.productName} onChange={(e) => handleChange("productName", e.target.value)}/>
            </Field.Root>     
            <Field.Root required>
              <Field.Label>{t.warehouse.stock_sample.purposeOfSample} <Field.RequiredIndicator/></Field.Label>
              {/* select */}
            </Field.Root>
          </SimpleGrid>
          
          <Field.Root mt={4}>
            <Field.Label>{t.warehouse.stock_sample.notes}</Field.Label>
            <Textarea placeholder={t.warehouse.stock_sample.additionalRemarksOptional} value={form.notes} onChange={(e) => handleChange("notes", e.target.value)}/>
          </Field.Root>

          <Heading size="sm" mt={6} mb={3}>{t.warehouse.stock_sample.lotDetails}</Heading>

          {form.lots.map((lot, index) => (
            <Card.Root key={index} mb={4} p={4}>
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} alignItems={"center"}>
                <Field.Root required>
                  <Field.Label>{t.warehouse.stock_sample.lotBatchNo} <Field.RequiredIndicator/></Field.Label>
                  <Input placeholder={t.warehouse.stock_out.lotPlaceholder} value={lot.lotNo} onChange={(e) => handleLotChange(index, "lotNo", e.target.value)}/>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t.warehouse.stock_sample.quantity} <Field.RequiredIndicator/></Field.Label>
                  <NumberInput.Root w={"100%"} onValueChange={(details) => handleLotChange(index, "qty", details.value)}>
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t.warehouse.stock_sample.unit}</Field.Label>
                  <Input placeholder={t.warehouse.stock_out.uomPlaceholder} value={lot.unit} onChange={(e) => handleLotChange(index, "unit", e.target.value)}/>
                </Field.Root>

                <Button color="red" borderColor={"red"} variant="outline" onClick={() => removeLotRow(index)} disabled={form.lots.length === 1}>
                  <FaTrash/> {t.master.remove} 
                </Button>
              </SimpleGrid>
            </Card.Root>
          ))}

          <Button mt={2}  variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}  onClick={addLotRow}>{t.warehouse.stock_sample.addLot}</Button>

          <Flex justify="flex-end" gap={3} mt={5}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.master.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={handleSubmit}>{t.warehouse.stock_sample.saveSampleStockOut}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
  );
}