"use client";

//Import dependencies
import { useState } from "react";
import { Button, Field, Flex, Heading, Image, Input, SimpleGrid, Text, Card, Stack, InputGroup, InputElement, IconButton } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword((prev) => !prev);
    const router = useRouter();

    async function RegisterOnClick(){
        router.push("/register");
    }

    async function ForgotPasswordOnClick(){
        router.push("/forgot-password");
    }

    async function LoginOnClick(){
        router.push("/bizgen/dashboard");
    }

    return (
        <Flex w="100vw" minH="100vh" bg="white" bgGradient="linear(to-br, #FFF7ED, #FFE6C9)" align="center" justify="center" p={{ base: 6, md: 10 }}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} w="100%" maxW="1100px" alignItems="center" gap={8}>
            <Flex justify="center" align="center" w="100%" display={{ base: "none", lg: "flex" }}>
                <Image src="/assets/login.jpg" w="90%" rounded="2xl" shadow="xl" alt="BizGen Illustration"/>
            </Flex>

            <Card.Root bg="whiteAlpha.900" shadow="xl" rounded="2xl" backdropFilter="auto" backdropBlur="8px" border="1px solid rgba(0,0,0,0.06)">
            <Card.Body p={{ base: 6, md: 10 }}>
                <Stack gap={6}>
                <Flex direction="column" align="center" textAlign="center">
                    <Image src="/assets/bizgen-logo.png" alt="BizGen Logo" w="72px" mb={2}/>
                    <Heading size="lg" color="#1E1E1E">
                    Welcome back 👋
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                    Sign in to continue managing your trading operations
                    </Text>
                </Flex>

                {/* <Divider /> */}

                <Field.Root>
                    <Field.Label color="gray.700" fontWeight="600">
                    Username
                    </Field.Label>
                    <Input placeholder="Enter your username" size="lg" rounded="lg" bg="gray.50" color={"black"} _focus={{ bg: "white", borderColor: "#E77A1F" }}/>
                </Field.Root>

                <Field.Root>
                    <Field.Label color="gray.700" fontWeight="600">
                    Password
                    </Field.Label>

                    <InputGroup>
                    <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" size="lg" rounded="lg" bg="gray.50" color={"black"} _focus={{ bg: "white", borderColor: "#E77A1F" }}/>

                    {/* <InputElement pr={2}>
                        <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        size="sm"
                        variant="ghost"
                        onClick={togglePassword}
                        >
                        {showPassword ? "🙈" : "👁️"}
                        </IconButton>
                    </InputElement> */}
                    </InputGroup>
                </Field.Root>

                <Button onClick={LoginOnClick} size="lg" rounded="lg" bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }}>
                    Sign in
                </Button>

                <Flex justify="space-between" fontSize={{base: "10px", md: "14px"}} color="gray.600">
                    <Text _hover={{ color: "#E77A1F", cursor: "pointer" }} onClick={ForgotPasswordOnClick} fontSize={{base: "10px", md: "14px"}}>
                    Forgot your password?
                    </Text>
                    <Text _hover={{ color: "#E77A1F", cursor: "pointer" }} onClick={RegisterOnClick} fontSize={{base: "10px", md: "14px"}}>
                    Don’t have an account? Register here
                    </Text>
                </Flex>
                </Stack>
            </Card.Body>
            </Card.Root>
        </SimpleGrid>
        </Flex>
    );
}