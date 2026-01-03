"use client";

import TopNavbar from "@/components/ui/TopNavBar";
import { Button, Card, Flex, Heading, Image, SimpleGrid, Text } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex bg="#FFF9F2" minH="100vh" flexDir={"column"} w={"100vw"}>
      <TopNavbar/>

      <Flex as="main" id="home-section" flexDir={"column"}>
        <Flex w="100%" px={{ base: "20px", md: "56px" }}
          py={{ base: "32px", md: "64px" }}
          align="center"
          justify="space-between"
          flexDir={{ base: "column", md: "row" }}
          gap={{ base: "32px", md: "24px" }}
        >
          {/* LEFT — Product Overview */}
          <Flex flexDir="column" maxW={{ base: "100%", md: "80%" }}>
            <Text fontWeight="700" fontSize={{ base: "12px", md: "14px" }} color="#E77A1F" bg="#FFE8D2" w="fit-content" px="10px" py="4px" rounded="full" mb="10px">BizGen ERP — Export & Import Trading System</Text>

            <Heading fontWeight="800" fontSize={{ base: "32px", md: "36px" }} lineHeight="120%" color="#1C1C1C" mb="14px">Scale Your Trading & Export‑Import Operations with One Powerful ERP Platform</Heading>
            <Text fontSize={{ base: "12px", md: "14px" }} color="#4B4B4B" lineHeight="150%" mb="22px">BizGen is an ERP system designed for high‑volume trading and export‑import businesses — helping you manage procurement, inventory, logistics, orders, finance, and reporting in one integrated platform.</Text>

            <Text fontSize={{ base: "12px", md: "13px" }} color="#6B6B6B" mb="18px">Plans start from <b>&nbsp;Rp 150.000 / month</b> — upgrade up tomulti‑user teams and extended features for growing operations.</Text>

            {/* CTA Buttons */}
            <Flex gap="14px" wrap="wrap">
              <Button px="18px" py="10px" bg="#E77A1F" color="white" fontWeight="700" rounded="lg" _hover={{ opacity: 0.9 }} cursor="pointer">Subscribe Now</Button>
              <Button px="18px" py="10px" border="1.5px solid #E77A1F" bg={"transparent"} color="#E77A1F" fontWeight="700" rounded="lg" _hover={{ bg: "#FFF3E8" }} cursor="pointer">Contact Us</Button>
            </Flex>
          </Flex>

          {/* RIGHT — Illustration / Product Visual */}
          <Flex maxW={{ base: "100%", md: "480px" }} w="100%" justify="center">
            <Image
              src="/assets/homepage.jpg"
              alt="BizGen ERP Export Import Dashboard"
              w={{base: "90%", md: "100%", lg: "70%"}}
              style={{ borderRadius: 16 }}
            />
          </Flex>
        </Flex>

        {/* PRICING — Similar style to Movira, with higher plans */}
        <Flex id="package-section"
          flexDir="column"
          mt={{ base: "12px", md: "32px" }}
          px={{ base: "20px", md: "56px" }}
          py={{ base: "28px", md: "56px" }}
          bg="white"
          roundedTop={{ base: "24px", md: "28px" }}
          gap="24px"
        >
          <Flex flexDir="column" align={{ base: "center", md: "flex-start" }}>
            <Text fontWeight="800" fontSize={{ base: "26px", md: "27px" }} color="#1C1C1C" mb="6px" textAlign={{ base: "center", md: "left" }}>Pricing Plans</Text>
            <Text fontSize={{ base: "12px", md: "14px" }} color="#4B4B4B" textAlign={{ base: "center", md: "left" }}>Choose a plan that fits your trading & export‑import operations.</Text>
          </Flex>

          <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={"30px"}>
            <Card.Root bg="#FFFDF9" _hover={{ borderColor: "#E77A1F" }} rounded="16px" border="1.5px solid #E9E9E9" p="18px">
              <Text fontWeight="700" fontSize="16px" color={"black"}>Starter</Text>
              <Text color="#6B6B6B" fontSize="13px" mb="10px">Suitable for early‑stage trading teams.</Text>
              <Text fontWeight="800" fontSize="28px" color="#E77A1F" mb="8px">Rp 250.000<span style={{ fontSize: 14 }}>/month</span></Text>
              <Text fontSize="13px" color="#6B6B6B" mb="12px">Up to 2 users • Core modules</Text>
              <Button bg="#E77A1F" color="white" fontWeight="700" _hover={{ opacity: 0.9 }}>
                Choose Starter Plan
              </Button>
            </Card.Root>
            <Card.Root bg="#FFFDF9" _hover={{ borderColor: "#E77A1F" }} rounded="16px" border="1.5px solid #E9E9E9" p="18px">
              <Flex w="fit-content" px="8px" py="4px" bg="#FFE8D2" color="#E77A1F" fontSize="12px" fontWeight="800" rounded="full" mb="8px" >
                MOST POPULAR
              </Flex>
              <Text fontWeight="700" fontSize="16px" color={"black"}>Growth — Most Popular</Text>
              <Text color="#6B6B6B" fontSize="13px" mb="10px">Best for growing trading & export‑import operations.</Text>
              <Text fontWeight="800" fontSize="28px" color="#E77A1F" mb="8px">Rp 350.000<span style={{ fontSize: 14 }}>/month</span></Text>
              <Text fontSize="13px" color="#6B6B6B" mb="12px">Up to 5 users • Advanced modules</Text>
              <Button bg="#E77A1F" color="white" fontWeight="700" _hover={{ opacity: 0.9 }}>
                Choose Growth Plan
              </Button>
            </Card.Root>
            <Card.Root bg="#FFFDF9" _hover={{ borderColor: "#E77A1F" }} rounded="16px" border="1.5px solid #E9E9E9" p="18px">
              <Text fontWeight="700" fontSize="16px" color={"black"}>Enterprise</Text>
              <Text color="#6B6B6B" fontSize="13px" mb="10px">Built for large‑scale trading & multi‑branch operations.</Text>
              <Text fontWeight="800" fontSize="28px" color="#E77A1F" mb="8px">Rp 500.000<span style={{ fontSize: 14 }}>/month</span></Text>
              <Text fontSize="13px" color="#6B6B6B" mb="12px">Up to 10 users • Full modules & priority support</Text>
              <Button bg="#E77A1F" color="white" fontWeight="700" _hover={{ opacity: 0.9 }}>
                Choose Enterprise Plan
              </Button>
            </Card.Root>
          </SimpleGrid>

        </Flex>
      </Flex>
    </Flex>
  );
};
