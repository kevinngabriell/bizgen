"use client";

import React, { useEffect, useState } from "react";
import { Heading, SimpleGrid, Field, Input, Textarea, Button, Flex, Text, Card, Select, IconButton } from "@chakra-ui/react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { useRouter } from "next/navigation";
import { getLang } from "@/lib/i18n";
import { FaTrash } from "react-icons/fa";


export default function CreateStockOutPage() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);

  //router authentication
  const router = useRouter();

  //language state 
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    referenceNo: "",
    productId: "",
    warehouseLocation: "",
    stockOutDate: "",
    notes: "",
  });

  const [lots, setLots] = useState([
    {
      lotNumber: "",
      quantity: 0,
      uom: "",
      stockOutType: "",
    },
  ]);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLotChange = (index: number, field: string, value: any) => {
    const updated = [...lots];
    // updated[index][field] = value;
    setLots(updated);
  };

  const addLotRow = () => {
    setLots((prev) => [
      ...prev,
      { lotNumber: "", quantity: 0, uom: "", stockOutType: "" },
    ]);
  };

  const removeLotRow = (index: number) => {
    if (lots.length === 1) return;
    const updated = lots.filter((_, i) => i !== index);
    setLots(updated);
  };

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
    
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: wire to API
    setTimeout(() => {
      setIsSubmitting(false);
    }, 800);
  };

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex flexDir={"column"}>
        <Heading mb={1}>{t.warehouse.stock_out.title}</Heading>
        <Text color="gray.500" fontSize={"sm"}>{t.warehouse.stock_out.subtitle}</Text>
      </Flex>

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field.Root required>
              <Field.Label>{t.warehouse.stock_out.product} <Field.RequiredIndicator/> </Field.Label>
              <Input placeholder={t.warehouse.stock_out.productPlaceholder} value={form.productId} onChange={(e) => handleFormChange("productId", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t.warehouse.stock_out.referenceNo}</Field.Label>
              <Input placeholder={t.warehouse.stock_out.referencePlaceholder} value={form.referenceNo} onChange={(e) => handleFormChange("referenceNo", e.target.value)}/>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t.warehouse.stock_out.warehouseLocation}</Field.Label>
              <Input placeholder={t.warehouse.stock_out.warehousePlaceholder} value={form.warehouseLocation} onChange={(e) => handleFormChange("warehouseLocation", e.target.value)}/>
            </Field.Root>

            <Field.Root required>
              <Field.Label>{t.warehouse.stock_out.stockOutDate} <Field.RequiredIndicator/> </Field.Label>
              <Input type="date" value={form.stockOutDate} onChange={(e) => handleFormChange("stockOutDate", e.target.value)}/>
            </Field.Root>
          </SimpleGrid>

          <Heading size="xl" mt={8} mb={4}>{t.warehouse.stock_out.lotDetails}</Heading>

          {lots.map((lot, index) => (
            <Card.Root key={index} mb={4}>
              <Card.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Field.Root required>
                    <Field.Label>{t.warehouse.stock_out.stockOutType} <Field.RequiredIndicator/></Field.Label>
                    {/* <Select.Root
                      placeholder="Select type"
                      value={lot.stockOutType}
                      onChange={(e) =>
                        handleLotChange(index, "stockOutType", e.target.value)
                      }
                    >
                      <option value="delivery">Delivery / Sales</option>
                      <option value="transfer">Warehouse Transfer Out</option>
                      <option value="sample">Sample Out</option>
                      <option value="damage">Damaged / Disposal</option>
                      <option value="adjustment">Adjustment Out</option>
                    </Select> */}
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>{t.warehouse.stock_out.lotNumber} <Field.RequiredIndicator/></Field.Label>
                    <Input placeholder={t.warehouse.stock_out.lotPlaceholder} value={lot.lotNumber} onChange={(e) => handleLotChange(index, "lotNumber", e.target.value)}/>
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>{t.warehouse.stock_out.quantityOut} <Field.RequiredIndicator/></Field.Label>
                    <Input type="number" min="1" value={lot.quantity} onChange={(e) => handleLotChange(index, "quantity", Number(e.target.value))}/>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t.warehouse.stock_out.uom}</Field.Label>
                    <Input placeholder={t.warehouse.stock_out.uomPlaceholder} value={lot.uom} onChange={(e) => handleLotChange(index, "uom", e.target.value)}/>
                  </Field.Root>
                </SimpleGrid>

                <Flex justify="flex-end" mt={4} gap={2}>
                  <Button size="sm" variant="outline" color={"red"} borderColor={"red"} onClick={() => removeLotRow(index)}>
                    Remove <FaTrash/>
                  </Button>
                </Flex>
              </Card.Body>
            </Card.Root>
          ))}

          <Button mt={2} variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}  size="sm" onClick={addLotRow}>
            {t.warehouse.stock_out.addLot}
          </Button>

          <Field.Root mt={6}>
            <Field.Label>{t.warehouse.stock_out.reasonNotes}</Field.Label>
            <Textarea rows={4} placeholder={t.warehouse.stock_out.notesPlaceholder} value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)}/>
          </Field.Root>

          <Flex justify="flex-end" mt={6} gap={6}>
            <Button variant="outline" bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"}>{t.delete_popup.cancel}</Button>
            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} type="submit">{t.warehouse.stock_out.save}</Button>
          </Flex>
        </Card.Body>
      </Card.Root>
    </SidebarWithHeader>
    
  );
}