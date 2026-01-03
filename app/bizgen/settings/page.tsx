"use client";

import UpgradeRequiredDialog from "@/components/dialog/UpgradeRequiredDialog";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Avatar, Badge, Box, Button, Card, Flex, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Settings (){
    return (
        <SidebarWithHeader username="kevin">
            <Card.Root mb={8}>
                <Card.Body>
                    <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
                        <HStack gap={4}>
                            {/* <Avatar src="/assets/company-logo.png" name="Company" size="lg" /> */}
                            <Box>
                                <Heading size="md">PT Bizgen Indonesia</Heading>
                                <HStack gap={2} mt={1}>
                                    <Badge colorPalette="green" variant="subtle">Active</Badge>
                                    <Badge bgColor={"#E77A1F"} variant="solid">Plan: Starter</Badge>
                                </HStack>
                                <Text mt={1} color="gray.500">Trading & Forwarding ERP Account</Text>
                            </Box>
                        </HStack>

                        <HStack>
                            <Button bg={"transparent"} borderColor={"#E77A1F"} color={"#E77A1F"} cursor={"pointer"} onClick={() => { window.location.href = "/bizgen/settings/company"; }}>
                                View Company Profile
                            </Button>
                            <Button bg={"#E77A1F"} color={"white"} cursor={"pointer"} onClick={() => { window.location.href = "/bizgen/billing"; }}>
                                Manage Subscription
                            </Button>
                        </HStack>
                    </Flex>
                </Card.Body>
            </Card.Root>

            <Heading mb={6}>Master Data &amp; Configuration</Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
                <SettingCard 
                    title="Users" 
                    description={"This menu will help you to manage your user well. Use this menu to create, search, reset, and delete user."} 
                    link={"/bizgen/settings/users"} 
                    _package={"Starter"}
                    imageSrc="assets/group.png" 
                />
                <SettingCard 
                    title="Product" 
                    description={"This menu will help you to manage your product well. Use this menu to create, search, reset, and delete product."} 
                    link={"/bizgen/settings/product"} 
                    _package={"Starter"}
                    imageSrc="assets/sack.png" 
                />
                <SettingCard 
                    title="Customer" 
                    description={"This menu will help you to manage your customer well. Use this menu to create, search, reset, and delete customer."} 
                    link={"/bizgen/settings/customer"} 
                    _package={"Starter"}
                    imageSrc="assets/costumer.png" 
                />
                <SettingCard 
                    title="Finance" 
                    description={"This menu will help you to manage your account code, bank account, and finance category."} 
                    link={"/bizgen/settings/finance"} 
                    _package={"Starter"}
                    imageSrc="assets/budget.png" 
                />
                <SettingCard 
                    title="Company" 
                    description={"This menu will help you to manage your company well. Use this menu to update your company data and company target."} 
                    link={"/bizgen/settings/company"} 
                    _package={"Starter"}
                    imageSrc="assets/office.png" 
                />
                <SettingCard 
                    title="Supplier" 
                    description={"This menu will help you to manage your supplier well. Use this menu to create, search, reset, and delete supplier."} 
                    link={"/bizgen/settings/supplier"} 
                    _package={"Starter"}
                    imageSrc="assets/wholesale.png" 
                />
                <SettingCard 
                    title="Term" 
                    description={"This menu will help you to manage your term well. Use this menu to create, search, reset, and delete term."} 
                    link={"/bizgen/settings/term"} 
                    _package={"Starter"}
                    imageSrc="assets/agreement.png" 
                />
                <SettingCard 
                    title="Origin" 
                    description={"This menu will help you to find the origin country and the area. This menu also provide free trade area."} 
                    link={"/bizgen/settings/origin"} 
                    _package={"Starter"}
                    imageSrc="assets/countries.png" 
                />
                <SettingCard 
                    title="Payment" 
                    description={"This menu will help you to manage your payment well. Use this menu to create, search, reset, and delete payment."} 
                    link={"/bizgen/settings/payment"} 
                    _package={"Starter"}
                    imageSrc="assets/credit.png" 
                />
                <SettingCard 
                    title="Currency" 
                    description={"This menu will help you to manage your currency well. Use this menu to create, search, reset, and delete currency."} 
                    link={"/bizgen/settings/currency"} 
                    _package={"Starter"}
                    imageSrc="assets/coin.png" 
                />
                <SettingCard 
                    title="Tax" 
                    description={"This menu will help you to manage your tax settings well. Use this menu to create, search, reset, and delete tax."} 
                    link={"/bizgen/settings/tax"} 
                    _package={"Starter"}
                    imageSrc="assets/tax.png" 
                />
                <SettingCard 
                    title="Shipment" 
                    description={"This menu will help you to manage your shipment settings well. Use this menu to create, search, reset, and delete shipment."} 
                    link={"/bizgen/settings/shipment"} 
                    _package={"Starter"}
                    imageSrc="assets/fast.png" 
                />
                <SettingCard 
                    title="Ship Via" 
                    description={"This menu will help you to manage your ship via settings well. Use this menu to create, search, reset, and delete ship via."} 
                    link={"/bizgen/settings/shipvia"} 
                    _package={"Starter"}
                    imageSrc="assets/cargo.png" 
                />
                <SettingCard 
                    title="Unit of Measurement" 
                    description={"This menu will help you to manage your uom settings well. Use this menu to create, search, reset, and delete uom."} 
                    link={"/bizgen/settings/uom"} 
                    _package={"Starter"}
                    imageSrc="assets/weight.png" 
                />
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
            <Card.Root
                onClick={handleSettingMenuOnClick}
                cursor="pointer"
                _hover={{ transform: "translateY(-4px)", transition: "0.15s ease", shadow: "md" }}
            >
                <Card.Body>
                    <Stack align="center" textAlign="center" gap={3}>
                        <img src={imageSrc} alt={title} style={{ width: 60, height: 60, objectFit: "contain" }} />
                        <Card.Title>{title}</Card.Title>
                        <Card.Description>{description}</Card.Description>
                    </Stack>
                </Card.Body>
            </Card.Root>

            <UpgradeRequiredDialog
                isOpen={showUpgradeDialog}
                onClose={() => setShowUpgradeDialog(false)}
                currentPackage={_package ?? ""}
                allowedPackages={["sysadmin"]}
            />
        </>
    );
}