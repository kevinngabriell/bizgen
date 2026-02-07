"use client";

import Loading from "@/components/loading";
import TopNavbar from "@/components/ui/TopNavBar";
import { getLang } from "@/lib/i18n";
import { BizgenListServiceData, getAllBizgenListService } from "@/lib/services";
import { Button, Card, Flex, Heading, Image, SimpleGrid, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [serviceData, setSerivceData] = useState<BizgenListServiceData[]>([]);
  
  //language setting to EN by default
  const t = getLang("en"); 

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    try {
      const serviceRes = await getAllBizgenListService('4538e501-66a3-483a-94f2-c6598fca289b');
      console.log(serviceRes);
      setSerivceData(serviceRes.data);
    } catch (error: any){
      setSerivceData([]);
    } finally {
      setLoading(false);
    }
  }

  if(loading) return <Loading/>

  return (
    <Flex bg="#FFF9F2" minH="100vh" flexDir={"column"} w={"100vw"}>
      <TopNavbar/>

      <Flex as="main" id="home-section" flexDir={"column"}>
        <Flex w="100%" px={{ base: "20px", md: "56px" }} py={{ base: "32px", md: "64px" }} align="center" justify="space-between" flexDir={{ base: "column", md: "row" }} gap={{ base: "32px", md: "24px" }}>
          {/* LEFT — Product Overview */}
          <Flex flexDir="column" maxW={{ base: "100%", md: "80%" }}>
            <Text fontWeight="700" fontSize={{ base: "12px", md: "14px" }} color="#E77A1F" bg="#FFE8D2" w="fit-content" px="10px" py="4px" rounded="full" mb="10px">{t.dashboard.apps_name}</Text>

            <Heading fontWeight="800" fontSize={{ base: "32px", md: "36px" }} lineHeight="120%" color="#1C1C1C" mb="14px">{t.dashboard.apps_short_desc}</Heading>
            <Text fontSize={{ base: "12px", md: "14px" }} color="#4B4B4B" lineHeight="150%" mb="22px">{t.dashboard.apps_description}</Text>

            <Text fontSize={{ base: "12px", md: "13px" }} color="#6B6B6B" mb="18px">{t.dashboard.action_desc}</Text>

            {/* CTA Buttons */}
            <Flex gap="14px" wrap="wrap">
              <Button p={4} bg="#E77A1F" color="white" fontWeight="700" rounded="lg" _hover={{ opacity: 0.9 }} cursor="pointer">{t.dashboard.subscribe_button}</Button>
              <Button p={4} border="1.5px solid #E77A1F" bg={"transparent"} color="#E77A1F" fontWeight="700" rounded="lg" _hover={{ bg: "#FFF3E8" }} cursor="pointer">{t.dashboard.contact_button}</Button>
            </Flex>
          </Flex>

          {/* RIGHT — Illustration / Product Visual */}
          <Flex maxW={{ base: "100%", md: "480px" }} w="100%" justify="center">
            <Image src="/assets/homepage.jpg" alt="BizGen ERP Export Import Dashboard"  w={{base: "90%", md: "100%", lg: "70%"}} style={{ borderRadius: 16 }}/>
          </Flex>
        </Flex>

        {/* PRICING — Similar style to Movira, with higher plans */}
        <Flex id="package-section" flexDir="column" mt={{ base: "12px", md: "32px" }} px={{ base: "20px", md: "56px" }}  py={{ base: "28px", md: "56px" }} bg="white" roundedTop={{ base: "24px", md: "28px" }} gap="24px">
          <Flex flexDir="column" align={{ base: "center", md: "flex-start" }}>
            <Text fontWeight="800" fontSize={{ base: "26px", md: "27px" }} color="#1C1C1C" mb="6px" textAlign={{ base: "center", md: "left" }}>{t.dashboard.pricing_plan_header}</Text>
            <Text fontSize={{ base: "12px", md: "14px" }} color="#4B4B4B" textAlign={{ base: "center", md: "left" }}>{t.dashboard.pricing_plan_desc}</Text>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="30px">
            {serviceData.map((service) => (
              <Card.Root key={service.service_id} bg="#FFFDF9" rounded="16px" border="1.5px solid #E9E9E9" p={9} _hover={{ borderColor: "#E77A1F" }}>
                <Text fontWeight="700" fontSize="16px">{service.service_name}</Text>

                <Text fontSize="13px" color="#6B6B6B" mb="10px">{service.service_description}</Text>

                <Text fontWeight="800" fontSize="28px" color="#E77A1F" mb="8px">
                  Rp {Number(service.service_price).toLocaleString("id-ID")}
                  <span style={{ fontSize: 14 }}>/month</span>
                </Text>

                <Text fontSize="13px" color="#6B6B6B" mb="12px">Billing: {service.billing_cycle}</Text>

                <Button bg="#E77A1F" color="white" fontWeight="700">Choose {service.service_name}</Button>
              </Card.Root>
            ))}
          </SimpleGrid>

        </Flex>
      </Flex>
    </Flex>
  );
};
