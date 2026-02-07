"use client";

import { useState } from "react";
import { Card, Field, Flex, Heading, Image, SimpleGrid, Stack, Text, Input, Button, HStack, PinInput, InputGroup} from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";
import { getLang } from "@/lib/i18n";
import Loading from "@/components/loading";
import { AlertMessage } from "@/components/ui/alert";
import { createOTPForgotPassword } from "@/lib/auth/forgot-password";

export default function ForgotPassword() { 
  const [isLoading, setIsLoading] = useState(false);
  const t = getLang("en"); 

  const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState('');
  const [messagePopup, setMessagePopup] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);


  const handleSendOtp = async (data: {phone_number: string;}) => {

    //Check validation phone number cannot be null !!
    if (!phone) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup('Invalid Request');
      setMessagePopup("Whatsapp number must be filled !!");
      setTimeout(() => setShowAlert(false), 6000);
      return;
    }

    try {
      setIsLoading(true);
      await createOTPForgotPassword(data);
      setStep("otp");
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup("Failed");
      setMessagePopup(err.message || "Failed to send OTP !!");
      setTimeout(() => setShowAlert(false), 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    console.log(otp);
    // try {

    //   setStep("password");
    // } catch (e) {
    //   setMessagePopup("OTP tidak valid.");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword)
      return setMessagePopup("Password & konfirmasi wajib diisi.");
    if (password !== confirmPassword)
      return setMessagePopup("Konfirmasi password tidak sama.");

    setIsLoading(true);

    try {
      // TODO: Reset password via backend
      // await api.auth.resetPassword({ phone, otp, password })

      // Optionally redirect to login page after success
      // router.push("/login")
    } catch (e) {
      setMessagePopup("Gagal reset password. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if(isLoading) return <Loading/>

  return (
    <Flex w="100vw" minH="100vh" bg="white" bgGradient="linear(to-br, #FFF7ED, #FFE6C9)" align="center" justify="center" p={{ base: 6, md: 10 }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} w="100%" maxW="100vw" alignItems="center" gap={8}>

        {/* Image Illustration */}
        <Flex justify="center" align="center" w="100%" display={{ base: "none", lg: "flex" }}>
          <Image src="/assets/login.jpg" w="70%" rounded="2xl" shadow="xl" alt="BizGen Illustration"/>
        </Flex>

        {/* Reset Password Area */}
        <Card.Root bg="whiteAlpha.900" w={{base: "100%", lg: "80%"}} shadow="xl" rounded="2xl" backdropFilter="auto" backdropBlur="8px" border="1px solid rgba(0,0,0,0.06)">
          
          <Card.Body p={{ base: 6, md: 10 }}>
            
            {/* Heading and Logo */}
            <Flex direction="column" align="center" textAlign="center" mb={8}>
              <Image src="/assets/logo.png" alt="BizGen Logo" w="72px" mb={2}/>
              <Heading size="lg" color="#1E1E1E">{t.forgot_password.title}</Heading>

              <Text color="gray.600" fontSize="sm">{t.forgot_password.description}</Text>
            </Flex>

            {/* Error handeling */}
            {showAlert && (<AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess}/>)}

            {/* Steps 1 - Define Phone Number */}
            {step === "phone" && (
              <>
                <Field.Root>
                  <Field.Label color="gray.700" fontWeight="600">{t.register.step_two_wa}</Field.Label>
                  <Input placeholder={t.register.step_two_wa_placeholder} value={phone} onChange={(e) => setPhone(e.target.value)}/>
                </Field.Root>

                <Button mt={8} bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={() => handleSendOtp({ phone_number: phone })}>{t.forgot_password.send_otp}</Button>
              </>
            )}

            {/* Step 2 - Insert 6 Digits OTP */}
            {step === "otp" && (
              <>
                <Text fontSize="sm" color="gray.700" textAlign="center" mb={3}>{t.forgot_password.description_verify_otp}</Text>
                    
                <Flex w={"100%"} justifyContent={"center"}>
                  <PinInput.Root otp gap={7} value={otp} onValueChange={(e) => setOtp(e.value)}>
                    <PinInput.HiddenInput />
                    <PinInput.Input index={0} />
                    <PinInput.Input index={1} />
                    <PinInput.Input index={2} />
                    <PinInput.Input index={3} />
                    <PinInput.Input index={4} />
                    <PinInput.Input index={5} />
                  </PinInput.Root>
                </Flex>

                <Button mt={3} bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={handleVerifyOtp}>{t.forgot_password.verify_button}</Button>
              </>
            )}

            {/* Step 3 - Change Password */}
            {step === "password" && (
              <>
                <Field.Root mb={5}>
                    <Field.Label color="gray.700" fontWeight="600">Password Baru</Field.Label>
                    <InputGroup>
                      <PasswordInput placeholder="Masukkan password baru" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    </InputGroup>
                </Field.Root>

                <Field.Root mb={4}>
                  <Field.Label color="gray.700" fontWeight="600">Konfirmasi Password</Field.Label>
                  <InputGroup>
                    <PasswordInput placeholder="Ulangi password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
                  </InputGroup>
                </Field.Root>

                <Button mt={4} bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }}onClick={handleResetPassword}>Reset Password</Button>
              </>
            )}
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </Flex>
  );
}