"use client";

import { useEffect, useState } from "react";
import { Button, Flex, Input, Textarea, Heading, Badge, Field, Card, Text, Table, IconButton, SimpleGrid } from "@chakra-ui/react";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { FaTrash } from "react-icons/fa";
import Loading from "@/components/loading";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { useRouter } from "next/navigation";

type InquiryMode = "create" | "view" | "edit";

export default function Inquiry() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
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

  const [mode, setMode] = useState<InquiryMode>("create");

  // Simulated inquiry data (replace later wiTable.ColumnHeader API data)
  const [form, setForm] = useState({
    inquiryNo: "",
    customerName: "",
    contactPerson: "",
    customerEmail: "",
    customerPhone: "",
    originCountry: "",
    destinationCountry: "",
    commodity: "",
    incoterm: "",
    shipmentType: "",
    remarks: "",
  });

  const isReadOnly = mode === "view";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: integrate wiTable.ColumnHeader API (create / update)
    console.log("Saving inquiry", form);
    setMode("view");
  };

  const handleEdit = () => setMode("edit");
  const handleCancelEdit = () => setMode("view");

  const [items, setItems] = useState([
    { name: "", hsCode: "", qty: "", unit: "", weight: "", cbm: "", packaging: "" }
    ]);

    const addItemRow = () => {
    setItems([
        ...items,
        { name: "", hsCode: "", qty: "", unit: "", weight: "", cbm: "", packaging: "" }
    ]);
    };

    const removeItemRow = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
    };

    const updateItemField = (index: number, field: string, value: string) => {
    const next = [...items];
    // @ts-ignore
    next[index][field] = value;
    setItems(next);
    };

  return (
    <SidebarWithHeader username="ssss">
      <Flex justify="space-between" mb={4}>
        <Heading size="md">
          {mode === "create" && "Create Inquiry"}
          {mode === "view" && "Inquiry Details"}
          {mode === "edit" && "Edit Inquiry"}
        </Heading>

        <Badge color={mode === "create" ? "blue" : mode === "edit" ? "yellow" : "green"}>
          {mode.toUpperCase()}
        </Badge>
      </Flex>

      <Card.Root mt={5}>
        <Card.Body>
          <SimpleGrid columns={{base: 1 ,md: 2}} gap={6}>
            <Field.Root>
              <Field.Label>Inquiry No.</Field.Label>
              <Input name="inquiryNo" value={form.inquiryNo} onChange={handleChange} readOnly={isReadOnly} placeholder="Auto / Manual"/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Customer Name</Field.Label>
              <Input name="customerName" value={form.customerName} onChange={handleChange} readOnly={isReadOnly} placeholder="Company / Client"/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Contact Person</Field.Label>
              <Input name="contactPerson" value={form.contactPerson} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Phone / WhatsApp</Field.Label>
              <Input name="customerPhone" value={form.customerPhone} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <Input name="customerEmail" value={form.customerEmail} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Shipment Type</Field.Label>
                {/* <Select
                  name="shipmentType"
                  value={form.shipmentType}
                  onChange={handleChange}
                  isDisabled={isReadOnly}
                >
                  <option value="">Select</option>
                  <option value="FCL">FCL</option>
                  <option value="LCL">LCL</option>
                  <option value="AIR">Air Freight</option>
                  <option value="DOMESTIC">Domestic</option>
                </Select> */}
            </Field.Root>
            <Field.Root>
              <Field.Label>Origin Country</Field.Label>
              <Input name="originCountry" value={form.originCountry} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Destination Country</Field.Label>
              <Input name="destinationCountry" value={form.destinationCountry} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Commodity</Field.Label>
              <Input name="commodity" value={form.commodity} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
            <Field.Root>
              <Field.Label>Incoterm</Field.Label>
                {/* <Select
                  name="incoterm"
                  value={form.incoterm}
                  onChange={handleChange}
                  isDisabled={isReadOnly}
                >
                  <option value="">Select</option>
                  <option value="EXW">EXW</option>
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                  <option value="DAP">DAP</option>
                  <option value="DDP">DDP</option>
                </Select> */}
            </Field.Root>

            <Field.Root>
              <Field.Label>Remarks / Special Instruction</Field.Label>
              <Textarea name="remarks" value={form.remarks} onChange={handleChange} readOnly={isReadOnly}/>
            </Field.Root>
          </SimpleGrid>
          
          <Card.Root mt={6}>
            <Card.Body>
              <Flex justify="space-between" align="center" mb="3">
                <Heading size="md">Commodity / Item List</Heading>
                <Button size="sm" bg="#E77A1F" color="white" onClick={addItemRow}>Add Item</Button>
              </Flex>

              <Text fontSize="sm" color="gray.600" mb="3">Tambahkan satu atau lebih item barang. Data ini akan dipakai untuk quotation & operasional.</Text>

              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Item Name</Table.ColumnHeader>
                    <Table.ColumnHeader>HS Code</Table.ColumnHeader>
                    <Table.ColumnHeader>Qty</Table.ColumnHeader>
                    <Table.ColumnHeader>Unit</Table.ColumnHeader>
                    <Table.ColumnHeader>Weight (KG)</Table.ColumnHeader>
                    <Table.ColumnHeader>CBM</Table.ColumnHeader>
                    <Table.ColumnHeader>Packaging</Table.ColumnHeader>
                    <Table.ColumnHeader></Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {items.map((row, index) => (
                    <Table.Row  key={index}>
                      <Table.Cell>
                        <Input value={row.name} placeholder="Commodity name" onChange={(e) => updateItemField(index, "name", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.hsCode} placeholder="HS Code" onChange={(e) => updateItemField(index, "hsCode", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.qty} placeholder="Qty" onChange={(e) => updateItemField(index, "qty", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.unit} placeholder="Unit" onChange={(e) => updateItemField(index, "unit", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.weight} placeholder="KG" onChange={(e) => updateItemField(index, "weight", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.cbm} placeholder="CBM" onChange={(e) => updateItemField(index, "cbm", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <Input value={row.packaging} placeholder="Carton / Pallet / Drum" onChange={(e) => updateItemField(index, "packaging", e.target.value)}/>
                      </Table.Cell>

                      <Table.Cell>
                        <IconButton aria-label="Remove" variant="ghost" color="red" onClick={() => removeItemRow(index)}>
                          <FaTrash/>  
                        </IconButton>
                      </Table.Cell>
                    </Table.Row >
                  ))}
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>

          <Flex justify="flex-end" mt={5}>
            {mode === "view" && (
              <Button color="yellow" onClick={handleEdit}>Edit</Button>
            )}

            {mode === "create" && (
              <Button color="gray">Save as Draft</Button>
            )}

            {mode !== "create" && (
              <Button color="purple">Submit Inquiry</Button>
            )}

            {mode === "view" && (
              <Button color="green">Export PDF</Button>
            )}
          </Flex>
        </Card.Body>
      </Card.Root>

      
    </SidebarWithHeader>
  );
}