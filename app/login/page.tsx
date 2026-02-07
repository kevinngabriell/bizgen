"use client";

//Import dependencies
import { useState } from "react";
import { Button, Field, Flex, Heading, Image, Input, SimpleGrid, Text, Card, InputGroup } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import Loading from "@/components/loading";
import { login } from "@/lib/auth/auth";
import { jwtDecode } from "jwt-decode";
import { AlertMessage } from "@/components/ui/alert";
import { getLang } from "@/lib/i18n";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [titlePopup, setTitlePopup] = useState('');
    const [messagePopup, setMessagePopup] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const t = getLang("en"); 
    const router = useRouter();

    async function RegisterOnClick(){
        router.push("/register");
    }

    async function ForgotPasswordOnClick(){
        router.push("/forgot-password");
    }

    async function LoginOnClick(){
        if(username === "" || password === ""){
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup('Error');
            setMessagePopup('Username dan password wajib diisi !!');
            setTimeout(() => setShowAlert(false), 8000);
            return;
        }

        setLoading(true);

        try {
            const res = await login(username, password);

            if (!res?.token) {
                throw new Error("Token tidak ditemukan di response login");
            }

            let decoded: any;

            try {
                decoded = jwtDecode(res.token);
            } catch {
                throw new Error("Token login tidak valid");
            }
            
            localStorage.setItem("token", res.token);

            router.push("/bizgen/dashboard");
        } catch (error:any){
            setShowAlert(true);
            setIsSuccess(false);
            setTitlePopup('Error');
            setMessagePopup(error.message);
            setTimeout(() => setShowAlert(false), 8000);
        } finally {
            setLoading(false);
        }
    }

    if(loading) return <Loading/>;

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
                            <Heading size="lg" color="#1E1E1E">{t.login.title}</Heading>
                            <Text color="gray.600" fontSize="sm">{t.login.description}</Text>
                        </Flex>

                        {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}
                        
                        {/* Username Input */}
                        <Field.Root mb={6}>
                            <Field.Label color="gray.700" fontWeight="600">{t.login.username}</Field.Label>
                            <Input placeholder={t.login.username_placeholder} size="md" rounded="lg" bg="gray.50" color={"black"} _focus={{ bg: "white", borderColor: "#E77A1F" }} value={username} onChange={(e) => setUsername(e.target.value)}/>
                        </Field.Root>

                        {/* Password Input */}
                        <Field.Root mb={6}>
                            <Field.Label color="gray.700" fontWeight="600">{t.login.password}</Field.Label>
                            <InputGroup>
                                <PasswordInput placeholder={t.login.password_placeholder} size="md" rounded="lg" bg="gray.50" color={"black"} _focus={{ bg: "white", borderColor: "#E77A1F"}} value={password} onChange={(e) => setPassword(e.target.value)}/>
                            </InputGroup>
                        </Field.Root>

                        {/* Login Button */}
                        <Button onClick={LoginOnClick} size="lg" rounded="md" bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} mb={7}>{t.login.sign_in_button}</Button>

                        {/* Register and Forgot Password */}
                        <Flex justify="space-between" fontSize={{base: "10px", md: "14px"}} color="gray.600">
                            <Text _hover={{ color: "#E77A1F", cursor: "pointer" }} onClick={ForgotPasswordOnClick} fontSize={{base: "10px", md: "12px"}}>{t.login.forgot_password}</Text>
                            <Text _hover={{ color: "#E77A1F", cursor: "pointer" }} onClick={RegisterOnClick} fontSize={{base: "10px", md: "12px"}}>{t.login.register}</Text>
                        </Flex>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>
        </Flex>
    );
}