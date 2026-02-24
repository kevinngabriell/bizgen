"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Button, Card, Flex, Heading, Text, SimpleGrid, Dialog, Portal, CloseButton } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Purchase (){
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
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
    
  const navigateToPurchaseImport = () => {
    router.push('/bizgen/purchase/purchase-import')
  }

  const navigateToPurchaseInvoice = () => {
    router.push('/bizgen/purchase/purchase-invoice')
  }

  const navigateToPurchaseLocal = () => {
    router.push('/bizgen/purchase/purchase-local')
  }

  const navigateToPurchaseRequisition = () => {
    router.push('/bizgen/purchase/purchase-requisition')
  }

  const navigateToReceivingItems = () => {
    router.push('/bizgen/purchase/receiving-items')
  }

  const navigateToRequestQuotation = () => {
    router.push('/bizgen/purchase/request-quotation')
  }

  if (loading) return <Loading/>;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      {/* Heading and Create Button */}
      <Flex gap={2} display={"flex"} mb={"6"} mt={"2"} alignItems={"center"}>
        <Heading flex="1">{t.purchaseModule.title}</Heading>
        
        {/* Create New — Quick Action Dialog */}
        <Dialog.Root>
          {/* Trigger Dialog */}
          <Dialog.Trigger asChild>
            <Button variant="outline" size="sm" bg={"#E77A1F"} color={"white"} cursor={"pointer"}>{t.master.create_new_button}</Button>
          </Dialog.Trigger>
          {/* Dialog Content */}
          <Portal>
            <Dialog.Backdrop/>
            <Dialog.Positioner>
              <Dialog.Content>
                {/* Dialog Header */}
                <Dialog.Header>
                  <Heading size="md">{t.master.create_new}</Heading>
                </Dialog.Header>

                {/* Dialog Body */}
                <Dialog.Body>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    {/* Request Quotation Card */}
                    <Card.Root _hover={{ bg: "gray.50" }} cursor="pointer" onClick={navigateToRequestQuotation}>
                      <Card.Body>
                        <Heading size="sm" mb={1}>{t.purchaseModule.request_quotation.title}</Heading>
                        <Text fontSize="sm" color="gray.600" onClick={() => {}}>{t.purchaseModule.request_quotation.description}</Text>
                      </Card.Body>
                    </Card.Root>

                    {/* Purchase Requisition Card */}
                    <Card.Root _hover={{ bg: "gray.50" }} cursor="pointer" onClick={navigateToPurchaseRequisition}>
                      <Card.Body>
                        <Heading size="sm" mb={1}>{t.purchaseModule.purchase_requisition.title}</Heading>
                        <Text fontSize="sm" color="gray.600">{t.purchaseModule.purchase_requisition.description}</Text>
                      </Card.Body>
                    </Card.Root>

                    {/* Purchase Local Card */}
                    <Card.Root _hover={{ bg: "gray.50" }} cursor="pointer" onClick={navigateToPurchaseLocal}>
                      <Card.Body>
                        <Heading size="sm" mb={1}>{t.purchaseModule.purchase_local.title}</Heading>
                        <Text fontSize="sm" color="gray.600">{t.purchaseModule.purchase_local.description}</Text>
                      </Card.Body>
                    </Card.Root>

                    {/* Purchase Import Card */}
                    <Card.Root _hover={{ bg: "gray.50" }} cursor="pointer" onClick={navigateToPurchaseImport}>
                      <Card.Body>
                        <Heading size="sm" mb={1}>{t.purchaseModule.purchase_import.title}</Heading>
                        <Text fontSize="sm" color="gray.600">{t.purchaseModule.purchase_import.description}</Text>
                      </Card.Body>
                    </Card.Root>

                    {/* Receiving Items Card */}
                    <Card.Root _hover={{ bg: "gray.50" }} cursor="pointer" onClick={navigateToReceivingItems}>
                      <Card.Body>
                        <Heading size="sm" mb={1}>{t.purchaseModule.receiving_items.title}</Heading>
                        <Text fontSize="sm" color="gray.600">{t.purchaseModule.receiving_items.description}</Text>
                      </Card.Body>
                    </Card.Root>

                    {/* Receiving Items Card */}
                    <Card.Root _hover={{ bg: "gray.50" }} cursor="pointer" onClick={navigateToPurchaseInvoice}>
                      <Card.Body>
                        <Heading size="sm" mb={1}>{t.purchaseModule.purchase_invoice.title}</Heading>
                        <Text fontSize="sm" color="gray.600">{t.purchaseModule.purchase_invoice.description}</Text>
                      </Card.Body>
                    </Card.Root>
                  </SimpleGrid>
                </Dialog.Body>

                {/* Dialog Close Trtigger */}
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>      
          </Portal>
        </Dialog.Root>
      </Flex>

      {/* Data Area */}
      <SimpleGrid gap={6} columns={{ base: 1, lg: 2 }}>
        {/* Request for Quotation */}
        <Card.Root>
          <Card.Body>
              <Flex>
                <Heading size="md" flex="1">{t.purchaseModule.request_quotation.title}</Heading>
                <Text fontSize="sm" cursor="pointer">{t.master.see_all}</Text>
              </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Requisition */}
        <Card.Root>
          <Card.Body>
              <Flex>
                <Heading size="md" flex="1">{t.purchaseModule.purchase_requisition.title}</Heading>
                <Text fontSize="sm" cursor="pointer">{t.master.see_all}</Text>
              </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Local */}
        <Card.Root>
          <Card.Body>
              <Flex>
                <Heading size="md" flex="1">{t.purchaseModule.purchase_local.title}</Heading>
                <Text fontSize="sm" cursor="pointer">{t.master.see_all}</Text>
              </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Import */}
        <Card.Root>
          <Card.Body>
              <Flex>
                <Heading size="md" flex="1">{t.purchaseModule.purchase_import.title}</Heading>
                <Text fontSize="sm" cursor="pointer">{t.master.see_all}</Text>
              </Flex>
          </Card.Body>
        </Card.Root>

        {/* Receiving Items */}
        <Card.Root>
          <Card.Body>
              <Flex>
                <Heading size="md" flex="1">{t.purchaseModule.receiving_items.title}</Heading>
                <Text fontSize="sm" cursor="pointer">{t.master.see_all}</Text>
              </Flex>
          </Card.Body>
        </Card.Root>

        {/* Purchase Invoice */}
        <Card.Root>
          <Card.Body>
              <Flex>
                <Heading size="md" flex="1">{t.purchaseModule.purchase_invoice.title}</Heading>
                <Text fontSize="sm" cursor="pointer">{t.master.see_all}</Text>
              </Flex>
          </Card.Body>
        </Card.Root>

      </SimpleGrid>
        </SidebarWithHeader>
    );
}