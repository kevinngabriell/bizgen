

'use client';

import SidebarWithHeader from '@/components/ui/SidebarWithHeader';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  Badge,
  SimpleGrid,
  Separator,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiFileText, FiSave, FiSend, FiArrowLeft } from 'react-icons/fi';

export default function BookingConfirmationPage() {
  const [isEdit, setIsEdit] = useState(true);

  return (
    <SidebarWithHeader username='--'>
        <Box p={{ base: 4, md: 6 }} maxW="1280px" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Booking Confirmation / Job Order</Heading>

        <HStack gap={3}>
          <Badge colorScheme="purple" fontSize="sm">
            Draft
          </Badge>
          <Button
            // leftIcon={<FiSave />}
            colorScheme="gray"
            variant="outline"
            onClick={() => setIsEdit(false)}
          >
            Save Draft
          </Button>
          <Button 
            // leftIcon={<FiSend />} 
            colorScheme="blue">
            Confirm & Create Job
          </Button>
        </HStack>
      </Flex>

      <Stack gap={6}>
        {/* Job Meta */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Job Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Booking No
                </Text>
                <Input placeholder="Auto / Manual"  />
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>
                  Job Type
                </Text>
                {/* <Select placeholder="Select job type">
                  <option>Export</option>
                  <option>Import</option>
                  <option>Domestic</option>
                </Select> */}
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>
                  Service
                </Text>
                {/* <Select placeholder="Select service">
                  <option>Sea Freight</option>
                  <option>Air Freight</option>
                  <option>Trucking</option>
                </Select> */}
              </Box>
            </SimpleGrid>

            <Grid
              templateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={4}
              mt={4}
            >
              <GridItem>
                <Text fontSize="sm" mb={1}>
                  Estimated Departure
                </Text>
                <Input type="date" />
              </GridItem>
              <GridItem>
                <Text fontSize="sm" mb={1}>
                  Estimated Arrival
                </Text>
                <Input type="date" />
              </GridItem>
            </Grid>
          </Card.Body>
        </Card.Root>

        {/* Parties */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Parties Information</Heading>
          </Card.Header>
          <Card.Body>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
              <GridItem>
                <Heading size="xs" mb={2}>
                  Shipper
                </Heading>
                <Stack gap={2}>
                  <Input placeholder="Company Name" />
                  <Input placeholder="Contact Person" />
                  <Textarea placeholder="Address" rows={3} />
                </Stack>
              </GridItem>

              <GridItem>
                <Heading size="xs" mb={2}>
                  Consignee
                </Heading>
                <Stack gap={2}>
                  <Input placeholder="Company Name" />
                  <Input placeholder="Contact Person" />
                  <Textarea placeholder="Address" rows={3} />
                </Stack>
              </GridItem>
            </Grid>
          </Card.Body>
        </Card.Root>

        {/* Routing & Cargo */}
        <Card.Root>
          <Card.Header pb={2}>
            <Heading size="sm">Routing & Cargo Details</Heading>
          </Card.Header>
          <Card.Body>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Origin Port / Location
                </Text>
                <Input placeholder="Origin" />
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>
                  Destination Port / Location
                </Text>
                <Input placeholder="Destination" />
              </Box>

              <Box>
                <Text fontSize="sm" mb={1}>
                  Incoterm
                </Text>
                {/* <Select placeholder="Select incoterm">
                  <option>FOB</option>
                  <option>CIF</option>
                  <option>EXW</option>
                </Select> */}
              </Box>
            </SimpleGrid>

            <Separator my={4} />

            <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Package Type
                </Text>
                <Input placeholder="Carton / Pallet / Loose" />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Total Packages
                </Text>
                <Input type="number" placeholder="0" />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Gross Weight (KG)
                </Text>
                <Input type="number" placeholder="0" />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  CBM / Volume
                </Text>
                <Input type="number" placeholder="0.00" />
              </Box>
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
              <Box>
                <Text fontSize="sm" mb={1}>
                  Freight Charge
                </Text>
                <Input type="number" placeholder="0" />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Local Charge
                </Text>
                <Input type="number" placeholder="0" />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Other Charge
                </Text>
                <Input type="number" placeholder="0" />
              </Box>
            </SimpleGrid>

            <Box mt={4}>
              <Text fontSize="sm" mb={1}>
                Remarks / Special Instruction
              </Text>
              <Textarea rows={3} placeholder="Optional notes" />
            </Box>
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