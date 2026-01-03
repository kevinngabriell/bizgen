"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import {Card, Heading, SimpleGrid, Stat, Table} from "@chakra-ui/react";

export default function Dashboard (){
    const daysToExpire = 3; // TODO: replace with value from API

    const dummyData = [
        { id: 1, name: "Produk A", price: 10000, stock: 20 },
        { id: 2, name: "Produk B", price: 25000, stock: 10 },
        { id: 3, name: "Produk C", price: 15000, stock: 30 },
    ];

    return(
        <SidebarWithHeader username="kevin" daysToExpire={daysToExpire}>
            <Heading mb={4}>ERP Dashboard</Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
                <StatCard title="Target" value="Rp 150jt"/>
                <StatCard title="Orders" value="320" />
                <StatCard title="New Customers" value="45" />
                <StatCard title="Stock Items" value="1200" />
            </SimpleGrid>

            <SimpleGrid columns={{base: 1, md: 2, lg: 2}} gap="20px" mt={10}>
                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData}/>
                    </Card.Body>
                </Card.Root>

                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData}/>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

            <SimpleGrid columns={{base: 1, md: 2, lg: 2}} gap="20px" mt={10}>
                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData}/>
                    </Card.Body>
                </Card.Root>

                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData}/>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

        </SidebarWithHeader>
    );
}

function StatCard({ title, value}: { title: string; value: string; }) {
  return (
    <Stat.Root p={5} shadow="md" border="1px solid" borderColor={useColorModeValue("gray.200", "gray.700")} borderRadius="lg" bg={useColorModeValue("white", "gray.800")}>
      <Stat.Label>{title}</Stat.Label>
      <Stat.ValueText>{value}</Stat.ValueText>
    </Stat.Root>
  );
}


interface TableData {
  id: number;
  name: string;
  price: number;
  stock: number;
}

function DataTable({ data }: { data: TableData[] }) {
    return (
        // <TableContainer.Root>
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Price</Table.ColumnHeader>
                    <Table.ColumnHeader>Stock</Table.ColumnHeader>
                </Table.Row>
            </Table.Header>
            <Table.Body>
            {data.map((item) => (
                <Table.Row key={item.id}>
                <Table.Cell>{item.id}</Table.Cell>
                <Table.Cell>{item.name}</Table.Cell>
                <Table.Cell>{item.price}</Table.Cell>
                <Table.Cell>{item.stock}</Table.Cell>
                </Table.Row>
            ))}
            </Table.Body>
        </Table.Root>
        // </TableContainer>
    );
}