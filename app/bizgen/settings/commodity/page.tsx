"use client";

import Loading from "@/components/loading";
import { AlertMessage } from "@/components/ui/alert";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { getAllCommodity, GetCommodityData } from "@/lib/master/commodity";
import { Button, Flex, Heading, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function SettingCommodity(){
    //authentication & loading variable
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    //Commodity related variable
    const [isCommodityOpen, setIsCommodityOpen] = useState(false);
    const [findCommodity, setFindCommodity] = useState('');
    const [commodityData, setCommodityData] = useState<GetCommodityData[]>([]);
    const [commodityPagination, setCommodityPagination] = useState({ total_pages: 1, page: 1 });
    const [commodityPage, setCommodityPage] = useState(1);
    const [editingCommodity, setEditingCommodity] = useState<GetCommodityData | null>(null);

    //alert success or failed
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);

    useEffect(() => {
        init();
    }, [commodityPage]);

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

        try {
            const commodityRes = await getAllCommodity(commodityPage, 10, findCommodity);
            setCommodityData(commodityRes.data);
            setCommodityPagination((prev) => ({
                ...prev,
                total_pages: commodityRes.pagination?.total_pages || 1,
                page: commodityPage,
            }));

        } catch (error: any){
            setCommodityData([]);

        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loading/>;

    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Commodity</Heading>
                {auth?.app_role_id === process.env.NEXT_ADMIN_ROLE_ID ? (
                    <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"}>Create New Commodity</Button>
                ) : null}
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
            
            <Table.Root showColumnBorder variant="outline" background={"white"} >
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Commodity Code</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Commodity Name</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Barang Bahaya</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Kebutuhan Khusus</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {commodityData?.map((commodity) => (
                        <Table.Row key={commodity.commodity_id}>
                            <Table.Cell textAlign={"center"}>{commodity.commodity_code}</Table.Cell>
                            <Table.Cell textAlign={"center"}>{commodity.commodity_name}</Table.Cell>
                            <Table.Cell textAlign={"center"}>{commodity.is_dangerous_good}</Table.Cell>
                            <Table.Cell textAlign={"center"}>{commodity.requires_special_handling}</Table.Cell>
                            <Table.Cell>Action</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

        </SidebarWithHeader>
    );
}