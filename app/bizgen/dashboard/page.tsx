"use client";

import { useEffect, useState } from "react";
import { useColorModeValue } from "@/components/ui/color-mode";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { Card, Heading, SimpleGrid, Stat, Table } from "@chakra-ui/react";
import Loading from "@/components/loading";
import { useRouter } from "next/navigation";
import { getLang } from "@/lib/i18n";
import { getActiveAnnouncements, Announcement } from "@/lib/system/announcement";
import AnnouncementPopup from "@/components/announcement/AnnouncementPopup";

export default function Dashboard() {
    //authentication & loading
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);
    //language
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);
    //announcement & popup
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [showPopup, setShowPopup] = useState(false);

    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if (!valid) return;

        const info = getAuthInfo();
        setAuth(info);

        const language = info?.language === "id" ? "id" : "en";
        setLang(language);

        const token = localStorage.getItem("token") ?? "";
        const sessionKey = `announcement_shown_${token.slice(-8)}`;

        if (!sessionStorage.getItem(sessionKey)) {
            try {
                const active = await getActiveAnnouncements();
                if (active.length > 0) {
                    setAnnouncements(active);
                    setShowPopup(true);
                }
            } catch {
                console.log("error while catch the session key");
            }
            sessionStorage.setItem(sessionKey, "true");
        }

        setLoading(false);
    };

    useEffect(() => {
        init();
    }, []);

    if (loading) return <Loading />;

    const dummyData = [
        { id: 1, name: "Produk A", price: 10000, stock: 20 },
        { id: 2, name: "Produk B", price: 25000, stock: 10 },
        { id: 3, name: "Produk C", price: 15000, stock: 30 },
    ];

    return (
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            {/* Announcement popup — shown once per login session */}
            <AnnouncementPopup announcements={announcements} open={showPopup} onClose={() => setShowPopup(false)}/>
            
            <Heading mb={4}>ERP Dashboard</Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
                <StatCard title="Target" value="Rp 150jt" />
                <StatCard title="Orders" value="320" />
                <StatCard title="New Customers" value="45" />
                <StatCard title="Stock Items" value="1200" />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap="20px" mt={10}>
                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData} />
                    </Card.Body>
                </Card.Root>

                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData} />
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap="20px" mt={10}>
                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData} />
                    </Card.Body>
                </Card.Root>

                <Card.Root>
                    <Card.Body>
                        <DataTable data={dummyData} />
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

        </SidebarWithHeader>
    );
}

function StatCard({ title, value }: { title: string; value: string }) {
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
    );
}
