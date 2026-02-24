"use client";

import UpgradeRequiredDialog from "@/components/dialog/UpgradeRequiredDialog";
import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Avatar, Badge, Box, Button, Card, Flex, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Settings (){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    //language state 
    const [lang, setLang] = useState<"en" | "id">("en");
    const t = getLang(lang);
    
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

    useEffect(() => {
        init();
    }, []);

    if(loading) return <Loading/>
    
    return (
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Card.Root mb={8}>
                <Card.Body>
                    <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
                        <HStack gap={4}>
                            <Box>
                                <Heading size="md">PT Bizgen Indonesia</Heading>
                                <HStack gap={2} mt={1}>
                                    <Badge colorPalette="green" variant="subtle">Active</Badge>
                                    <Badge bgColor={"#E77A1F"} variant="solid">Plan: Starter</Badge>
                                </HStack>
                                <Text mt={1} color="gray.500">Trading & Forwarding ERP Account</Text>
                            </Box>
                        </HStack>

                        <Flex gap={5}>
                            <Button bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => { window.location.href = "/bizgen/settings/company"; }}>{t.settings_menu.view_company}</Button>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() => { window.location.href = "/bizgen/billing"; }}>{t.settings_menu.manage_subscription}</Button>
                        </Flex>
                    </Flex>
                </Card.Body>
            </Card.Root>

            <Heading mb={6}>Master Data &amp; Configuration</Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
                <SettingCard title={t.settings_menu.user} description={t.settings_menu.user_description} link={"/bizgen/settings/users"} _package={"Starter"} imageSrc="/assets/user.svg"/>
                <SettingCard title={t.settings_menu.product} description={t.settings_menu.product_description} link={"/bizgen/settings/product"} _package={"Starter"} imageSrc="/assets/product.svg"/>
                <SettingCard title={t.settings_menu.customer} description={t.settings_menu.customer_description} link={"/bizgen/settings/customer"} _package={"Starter"} imageSrc="/assets/customer.svg"/>
                <SettingCard title={t.settings_menu.finance} description={t.settings_menu.finance_description} link={"/bizgen/settings/finance"} _package={"Starter"} imageSrc="/assets/deposit.svg" />
                <SettingCard title={t.settings_menu.supplier} description={t.settings_menu.supplier_description} link={"/bizgen/settings/supplier"} _package={"Starter"} imageSrc="/assets/delivery.svg"/>
                <SettingCard title={t.settings_menu.term} description={t.settings_menu.term_description} link={"/bizgen/settings/term"} _package={"Starter"} imageSrc="/assets/document-folder.svg"/>
                <SettingCard title={t.settings_menu.origin} description={t.settings_menu.origin_description} link={"/bizgen/settings/origin"} _package={"Starter"} imageSrc="/assets/city.svg"/>
                <SettingCard title={t.settings_menu.payment} description={t.settings_menu.payment_description} link={"/bizgen/settings/payment"} _package={"Starter"} imageSrc="/assets/bank-card-one.svg"/>
                <SettingCard title={t.settings_menu.currency} description={t.settings_menu.currency_description} link={"/bizgen/settings/currency"} _package={"Starter"} imageSrc="/assets/currency.svg"/>
                <SettingCard title={t.settings_menu.tax} description={t.settings_menu.tax_description} link={"/bizgen/settings/tax"} _package={"Starter"} imageSrc="/assets/bill.svg"/>
                <SettingCard title={t.settings_menu.shipment} description={t.settings_menu.shipment_description} link={"/bizgen/settings/shipment"} _package={"Starter"} imageSrc="/assets/calendar.svg"/>
                <SettingCard title={t.settings_menu.ship} description={t.settings_menu.ship_description} link={"/bizgen/settings/shipvia"} _package={"Starter"} imageSrc="/assets/ship.svg"/>
                <SettingCard title={t.settings_menu.uom} description={t.settings_menu.uom_description} link={"/bizgen/settings/uom"} _package={"Starter"} imageSrc="/assets/weight.svg"/>
                <SettingCard title={t.settings_menu.port} description={t.settings_menu.port_description} link={"/bizgen/settings/port"} _package={"Starter"} imageSrc="/assets/ship.svg"/>
                <SettingCard title="Commodity" description="Commodity Desc" link={"/bizgen/settings/commodity"} _package={"Starter"} imageSrc="/assets/ship.svg"/>
            </SimpleGrid>
        </SidebarWithHeader>
    );
}

function SettingCard({ title, description, link, _package, imageSrc } : 
    { title: string, description: string, link: string, _package: string, imageSrc: string }) {
    const router = useRouter();
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const handleSettingMenuOnClick = () => {
        router.push(link);
    }   

    return(
        <>
            <Card.Root onClick={handleSettingMenuOnClick} cursor="pointer" _hover={{ transform: "translateY(-4px)", transition: "0.15s ease", shadow: "md" }}>
                <Card.Body>
                    <Stack align="center" textAlign="center" gap={3}>
                        <img src={imageSrc} alt={title} style={{ width: 60, height: 60, objectFit: "contain" }} />
                        <Card.Title>{title}</Card.Title>
                        <Card.Description>{description}</Card.Description>
                    </Stack>
                </Card.Body>
            </Card.Root>

            <UpgradeRequiredDialog isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} currentPackage={_package ?? ""} allowedPackages={["sysadmin"]} />
        </>
    );
}