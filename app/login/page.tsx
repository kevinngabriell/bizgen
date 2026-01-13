"use client";

//Import dependencies
import { useState } from "react";
import { Button, Field, Flex, Heading, Image, Input, SimpleGrid, Text, Card, InputGroup } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <Flex w="100vw" maxH="100vh" bg="white" bgGradient="linear(to-br, #FFF7ED, #FFE6C9)" align="center" justify="center" p={{ base: 6, md: 10 }}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} w="100%" maxW="100vw" alignItems="center" gap={8}>
                {/* Left Side */}
                <Flex justify="center" align="center" w="100%" maxH={"100vh"} display={{ base: "none", lg: "flex" }}>
                    <Image src="/assets/login.jpg" w="70%" rounded="2xl" shadow="xl" alt="BizGen Illustration"/>
                </Flex>

                {/* Login Card */}
                <Card.Root bg="whiteAlpha.900" w={{base: "100%", lg: "80%"}} shadow="xl" rounded="2xl" backdropFilter="auto" backdropBlur="8px" border="1px solid rgba(0,0,0,0.06)">
                    <Card.Body p={{ base: 6, md: 10 }}>
                        
                        {/* Logo and Welcome Text */}
                        <Flex direction="column" align="center" textAlign="center" mb={8}>
                            <Image src="/assets/logo.png" alt="BizGen Logo" w="72px" mb={2}/>
                            <Heading size="lg" color="#1E1E1E">Welcome back 👋</Heading>
                            <Text color="gray.600" fontSize="sm">Sign in to continue managing your trading operations</Text>
                        </Flex>
                        
                        {/* Username Input */}
                        <Field.Root mb={6}>
                            <Field.Label color="gray.700" fontWeight="600">Username</Field.Label>
                            <Input placeholder="Enter your username" size="md" rounded="lg" bg="gray.50" color={"black"} _focus={{ bg: "white", borderColor: "#E77A1F" }}/>
                        </Field.Root>

                        {/* Password Input */}
                        <Field.Root mb={6}>
                            <Field.Label color="gray.700" fontWeight="600">Password</Field.Label>
                            <InputGroup>
                                <PasswordInput placeholder="Enter your password" size="md" rounded="lg" bg="gray.50" color={"black"} _focus={{ bg: "white", borderColor: "#E77A1F" }}/>
                            </InputGroup>
                        </Field.Root>

                        {/* Login Button */}
                        <Button onClick={LoginOnClick} size="lg" rounded="md" bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} mb={7}>Sign in</Button>

                        {/* Register and Forgot Password */}
                        <Flex justify="space-between" fontSize={{base: "10px", md: "14px"}} color="gray.600">
                            <Text _hover={{ color: "#E77A1F", cursor: "pointer" }} onClick={ForgotPasswordOnClick} fontSize={{base: "10px", md: "12px"}}>Forgot your password?</Text>
                            <Text _hover={{ color: "#E77A1F", cursor: "pointer" }} onClick={RegisterOnClick} fontSize={{base: "10px", md: "12px"}}>Don’t have an account? Register here</Text>
                        </Flex>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>
        </Flex>
    );
}