// app/not-found.tsx
"use client";

import { Box, Heading, Text, Button, Stack, Flex, Image } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    async function ToHome(){
        router.push('/bizgen/dashboard');
    }

    return (
        <Flex w={"100%"} align={"center"} justify={"center"} display={"flex"} flexDirection={"column"}>
            <Image src={"404.png"} w={"20%"}/>
            <Heading fontSize="2xl" mb={2}>
                Halaman ini ngilang, gak bilang apa-apa 😭
            </Heading>
            <Text color="gray.600" mb={6}>
                Kayak dia, ninggalin pas lagi sayang-sayangnya 💔  
                Balik aja ke home, masih banyak halaman yang setia kok.
            </Text>
            <Button onClick={ToHome} colorScheme="blue">
                Balik ke Home
            </Button>
        </Flex>
    );
}