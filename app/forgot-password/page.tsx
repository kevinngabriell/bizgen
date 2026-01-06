"use client";

import { useState } from "react";
import { Card, Field, Flex, Heading, Image, SimpleGrid, Stack, Text, Input, Button, HStack, PinInput, InputGroup} from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";

export default function ForgotPassword() {
  const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) return setError("Nomor WhatsApp wajib diisi.");
    setError(null);
    setIsLoading(true);

    try {
      // TODO: Call backend to send OTP to WhatsApp
      // await api.auth.sendOtp({ phone })

      // TEMP: Bypass OTP step during development
      setStep("otp");
    } catch (e) {
      setError("Gagal mengirim OTP. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    // if (otp.length !== 6) return setError("Kode OTP harus 6 digit.");
    // setError(null);
    // setIsLoading(true);

    try {
      // TODO: Verify OTP via backend
      // await api.auth.verifyOtp({ phone, otp })

      setStep("password");
    } catch (e) {
      setError("OTP tidak valid.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword)
      return setError("Password & konfirmasi wajib diisi.");
    if (password !== confirmPassword)
      return setError("Konfirmasi password tidak sama.");

    setError(null);
    setIsLoading(true);

    try {
      // TODO: Reset password via backend
      // await api.auth.resetPassword({ phone, otp, password })

      // Optionally redirect to login page after success
      // router.push("/login")
    } catch (e) {
      setError("Gagal reset password. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex w="100vw" minH="100vh" bg="white" bgGradient="linear(to-br, #FFF7ED, #FFE6C9)" align="center" justify="center" p={{ base: 6, md: 10 }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} w="100%" maxW="100vw" alignItems="center" gap={8}>
        {/* Image Illustration */}
        <Flex justify="center" align="center" w="100%" display={{ base: "none", lg: "flex" }}>
          <Image src="/assets/bizgen-hero.png" w="70%" rounded="2xl" shadow="xl" alt="BizGen Illustration"/>
        </Flex>

        {/* Reset Password Area */}
        <Card.Root bg="whiteAlpha.900" w={{base: "100%", lg: "80%"}} shadow="xl" rounded="2xl" backdropFilter="auto" backdropBlur="8px" border="1px solid rgba(0,0,0,0.06)">
          
          <Card.Body p={{ base: 6, md: 10 }}>
            
            {/* Heading and Logo */}
            <Flex direction="column" align="center" textAlign="center" mb={8}>
              <Image src="/assets/bizgen-logo.png" alt="BizGen Logo" w="72px" mb={2}/>
              <Heading size="lg" color="#1E1E1E">Reset Password </Heading>

              <Text color="gray.600" fontSize="sm">Reset password akun kamu melalui verifikasi Whatsapp</Text>
            </Flex>

            {/* Error handeling */}
            {error && (
              <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>
            )}

            {/* Steps 1 - Define Phone Number */}
            {step === "phone" && (
              <>
                <Field.Root>
                  <Field.Label color="gray.700" fontWeight="600">Nomor Whatsapp</Field.Label>
                  <Input placeholder="Masukkan nomor Whatsapp" value={phone} onChange={(e) => setPhone(e.target.value)}/>
                </Field.Root>

                <Button mt={8} bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={handleSendOtp}>Kirim OTP</Button>
              </>
            )}

            {/* Step 2 - Insert 6 Digits OTP */}
            {step === "otp" && (
              <>
                <Text fontSize="sm" color="gray.700" textAlign="center" mb={3}>Masukkan kode OTP 6 digit yang dikirim ke WhatsApp</Text>
                    
                <Flex w={"100%"} justifyContent={"center"}>
                  <PinInput.Root otp gap={7}>
                    <PinInput.HiddenInput />
                    <PinInput.Input index={0} />
                    <PinInput.Input index={1} />
                    <PinInput.Input index={2} />
                    <PinInput.Input index={3} />
                    <PinInput.Input index={4} />
                    <PinInput.Input index={5} />
                  </PinInput.Root>
                </Flex>

                <Button mt={3} bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={handleVerifyOtp}>Verifikasi OTP</Button>
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