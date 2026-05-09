"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, Flex, Heading, Image, SimpleGrid, Text, Input, Button, PinInput, InputGroup } from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";
import { getLang } from "@/lib/i18n";
import Loading from "@/components/loading";
import { AlertMessage } from "@/components/ui/alert";
import { createOTPForgotPassword, changePasswordForgotPassword } from "@/lib/auth/forgot-password";

export default function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = getLang("en");

  const [step, setStep] = useState<"phone" | "otp" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState("");
  const [messagePopup, setMessagePopup] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  function showError(title: string, message: string) {
    setShowAlert(true);
    setIsSuccess(false);
    setTitlePopup(title);
    setMessagePopup(message);
    setTimeout(() => setShowAlert(false), 6000);
  }

  // Step 1 – send OTP via POST, capture user_id from response
  const handleSendOtp = async () => {
    if (!phone.trim()) {
      showError("Invalid Request", "WhatsApp number must be filled.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await createOTPForgotPassword({ phone_number: phone.trim() });
      setUserId(res.data?.user_id ?? "");
      setStep("otp");
    } catch (err: any) {
      showError("Failed", err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 – just validate all 6 digits are filled, then advance
  // (OTP is actually verified by the backend together with the new password on PUT)
  const handleVerifyOtp = () => {
    const otpString = otp.join("");
    if (otpString.length < 6 || otp.some((d) => d === "")) {
      showError("Incomplete OTP", "Please enter all 6 digits of the OTP code.");
      return;
    }
    setStep("password");
  };

  // Step 3 – validate locally then call PUT to verify OTP + reset password together
  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showError("Validation Error", "Password & confirmation are required.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Validation Error", "Passwords do not match. Please re-enter.");
      return;
    }
    if (password.length < 8) {
      showError("Validation Error", "Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsLoading(true);
      await changePasswordForgotPassword({
        user_id: userId,
        phone_number: phone.trim(),
        otp_code: otp.join(""),
        new_password: password,
      });

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup("Success");
      setMessagePopup("Password reset successfully. Redirecting to login...");

      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      showError("Failed", err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Flex w="100vw" minH="100vh" bg="white" bgGradient="linear(to-br, #FFF7ED, #FFE6C9)" align="center" justify="center" p={{ base: 6, md: 10 }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} w="100%" maxW="100vw" alignItems="center" gap={8}>

        {/* Image Illustration */}
        <Flex justify="center" align="center" w="100%" display={{ base: "none", lg: "flex" }}>
          <Image src="/assets/login.jpg" w="70%" rounded="2xl" shadow="xl" alt="BizGen Illustration" />
        </Flex>

        {/* Reset Password Card */}
        <Card.Root bg="whiteAlpha.900" w={{ base: "100%", lg: "80%" }} shadow="xl" rounded="2xl" backdropFilter="auto" backdropBlur="8px" border="1px solid rgba(0,0,0,0.06)">
          <Card.Body p={{ base: 6, md: 10 }}>

            {/* Logo & Heading */}
            <Flex direction="column" align="center" textAlign="center" mb={8}>
              <Image src="/assets/logo.png" alt="BizGen Logo" w="72px" mb={2} />
              <Heading size="lg" color="#1E1E1E">{t.forgot_password.title}</Heading>
              <Text color="gray.600" fontSize="sm">{t.forgot_password.description}</Text>
            </Flex>

            {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

            {/* ── Step 1: Enter WhatsApp number ── */}
            {step === "phone" && (
              <>
                <Field.Root>
                  <Field.Label color="gray.700" fontWeight="600">{t.register.step_two_wa}</Field.Label>
                  <Input
                    placeholder={t.register.step_two_wa_placeholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  />
                </Field.Root>

                <Button mt={8} w="100%" bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={handleSendOtp}>
                  {t.forgot_password.send_otp}
                </Button>
              </>
            )}

            {/* ── Step 2: Enter 6-digit OTP ── */}
            {step === "otp" && (
              <>
                <Text fontSize="sm" color="gray.600" textAlign="center" mb={1}>
                  OTP sent to <b>{phone}</b>
                </Text>
                <Text fontSize="sm" color="gray.700" textAlign="center" mb={6}>
                  {t.forgot_password.description_verify_otp}
                </Text>

                <Flex w="100%" justifyContent="center" mb={6}>
                  <PinInput.Root
                    otp
                    value={otp}
                    onValueChange={(e) => setOtp(e.value)}
                    style={{ display: "flex", gap: "16px" }}
                  >
                    <PinInput.HiddenInput />
                    <PinInput.Input index={0} style={{ width: "52px", height: "56px", fontSize: "22px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #CBD5E0" }} />
                    <PinInput.Input index={1} style={{ width: "52px", height: "56px", fontSize: "22px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #CBD5E0" }} />
                    <PinInput.Input index={2} style={{ width: "52px", height: "56px", fontSize: "22px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #CBD5E0" }} />
                    <PinInput.Input index={3} style={{ width: "52px", height: "56px", fontSize: "22px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #CBD5E0" }} />
                    <PinInput.Input index={4} style={{ width: "52px", height: "56px", fontSize: "22px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #CBD5E0" }} />
                    <PinInput.Input index={5} style={{ width: "52px", height: "56px", fontSize: "22px", textAlign: "center", borderRadius: "10px", border: "1.5px solid #CBD5E0" }} />
                  </PinInput.Root>
                </Flex>

                <Button w="100%" bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={handleVerifyOtp}>
                  {t.forgot_password.verify_button}
                </Button>

                <Text mt={4} fontSize="xs" color="gray.500" textAlign="center">
                  Didn&apos;t receive a code?{" "}
                  <Text as="span" color="#E77A1F" cursor="pointer" fontWeight="semibold" onClick={() => { setOtp(["","","","","",""]); handleSendOtp(); }}>
                    Resend OTP
                  </Text>
                </Text>
              </>
            )}

            {/* ── Step 3: Set new password ── */}
            {step === "password" && (
              <>
                <Field.Root mb={5} invalid={!!password && password.length < 8}>
                  <Field.Label color="gray.700" fontWeight="600">New Password</Field.Label>
                  <InputGroup>
                    <PasswordInput
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </InputGroup>
                  {password && password.length < 8 && (
                    <Field.ErrorText>Password must be at least 8 characters</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root mb={6} invalid={!!confirmPassword && password !== confirmPassword}>
                  <Field.Label color="gray.700" fontWeight="600">Confirm Password</Field.Label>
                  <InputGroup>
                    <PasswordInput
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </InputGroup>
                  {confirmPassword && password !== confirmPassword && (
                    <Field.ErrorText>Passwords do not match</Field.ErrorText>
                  )}
                </Field.Root>

                <Button w="100%" bg="#E77A1F" color="white" _hover={{ bg: "#cf6a17" }} _active={{ bg: "#b85c13" }} onClick={handleResetPassword}>
                  Reset Password
                </Button>
              </>
            )}

          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </Flex>
  );
}
