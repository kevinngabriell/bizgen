'use client';

import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import { Box, Button, Card, Flex, Grid, GridItem, Heading, Icon, Input, Stack, Text, Textarea, Badge, SimpleGrid, Separator, Field } from '@chakra-ui/react';
import { useState } from 'react';
import { FiFileText } from 'react-icons/fi';

export default function BookingConfirmationPage() {
  const [isEdit, setIsEdit] = useState(true);

  return (
    <SidebarWithHeader username='--'>
      
      <Box p={{ base: 4, md: 6 }} maxW="1280px" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Booking Confirmation / Job Order</Heading>

        <SimpleGrid gap={3}>
          <Badge fontSize="sm">
            Draft
          </Badge>
          <Button variant="outline" onClick={() => setIsEdit(false)}>
            Save Draft
          </Button>
          <Button >
            Confirm & Create Job
          </Button>
        </SimpleGrid>
      </Flex>

      <Stack gap={6}>
        {/* Job Meta */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Job Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Booking No </Field.Label>
                <Input placeholder="Auto / Manual"  />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Job Type </Field.Label>
                {/* <Select placeholder="Select job type">
                  <option>Export</option>
                  <option>Import</option>
                  <option>Domestic</option>
                </Select> */}
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Service </Field.Label>
                {/* <Select placeholder="Select service">
                  <option>Sea Freight</option>
                  <option>Air Freight</option>
                  <option>Trucking</option>
                </Select> */}
              </Field.Root>
            </SimpleGrid>

            <SimpleGrid column={{ base: '1fr', md: '1fr 1fr' }} gap={4} mt={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Estimated Departure </Field.Label>
                <Input type="date" />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Estimated Arrival </Field.Label>
                <Input type="date" />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Parties */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Parties Information</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid column={{ base: '1fr', md: '1fr 1fr' }} gap={6}>


              <Field.Root>
                <Field.Label mb={2}>
                  Shipper
                </Field.Label>
                <Stack gap={2}>
                  <Input placeholder="Company Name" />
                  <Input placeholder="Contact Person" />
                  <Textarea placeholder="Address" rows={3} />
                </Stack>
              </Field.Root>

              <Field.Root>
                <Field.Label mb={2}> Consignee </Field.Label>
                <Stack gap={2}>
                  <Input placeholder="Company Name" />
                  <Input placeholder="Contact Person" />
                  <Textarea placeholder="Address" rows={3} />
                </Stack>
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Routing & Cargo */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Routing & Cargo Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}>Origin Port / Location</Field.Label>
                <Input placeholder="Origin" />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Destination Port / Location </Field.Label>
                <Input placeholder="Destination" />
              </Field.Root>

              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Incoterm </Field.Label>
                {/* <Select placeholder="Select incoterm">
                  <option>FOB</option>
                  <option>CIF</option>
                  <option>EXW</option>
                </Select> */}
              </Field.Root>
            </SimpleGrid>

            <Separator my={4} />

            <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Package Type </Field.Label>
                <Input placeholder="Carton / Pallet / Loose" />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Total Packages </Field.Label>
                <Input type="number" placeholder="0" />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> Gross Weight (KG) </Field.Label>
                <Input type="number" placeholder="0" />
              </Field.Root>
              <Field.Root>
                <Field.Label fontSize="sm" mb={1}> CBM / Volume </Field.Label>
                <Input type="number" placeholder="0.00" />
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        {/* Charges Summary */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Charges Summary</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Field.Root>
                <Text fontSize="sm" mb={1}>
                  Freight Charge
                </Text>
                <Input type="number" placeholder="0" />
              </Field.Root>
              <Field.Root>
                <Text fontSize="sm" mb={1}>
                  Local Charge
                </Text>
                <Input type="number" placeholder="0" />
              </Field.Root>
              <Field.Root>
                <Text fontSize="sm" mb={1}>
                  Other Charge
                </Text>
                <Input type="number" placeholder="0" />
              </Field.Root>
            </SimpleGrid>

            <Field.Root mt={4}>
              <Text fontSize="sm" mb={1}>
                Remarks / Special Instruction
              </Text>
              <Textarea rows={3} placeholder="Optional notes" />
            </Field.Root>
          </Card.Body>
        </Card.Root>

        {/* Attachments */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Attachments</Heading>
          </Card.Header>
          <Card.Body>
            <Flex
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="lg"
              p={6}
              align="center"
              justify="center"
              direction="column"
              gap={2}
              textAlign="center"
            >
              <Icon as={FiFileText} boxSize={8} color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                Upload supporting documents (optional)
              </Text>
              <Button size="sm" variant="outline">
                Choose File
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Box>
    </SidebarWithHeader>
    
  );
}