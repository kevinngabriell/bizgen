"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { AlertMessage } from "@/components/ui/alert";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { updateProfile } from "@/lib/account/profile";
import {
  Box, Button, Card, Field, Flex, Heading, Input, Separator, Text,
} from "@chakra-ui/react";
import { Suspense, useEffect, useState } from "react";

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "id">("en");
  const t = getLang(lang);

  const [showAlert, setShowAlert] = useState(false);
  const [titlePopup, setTitlePopup] = useState("");
  const [messagePopup, setMessagePopup] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const valid = await checkAuthOrRedirect();
        if (!valid) return;
        const info = getAuthInfo();
        setAuth(info);
        const language = info?.language === "id" ? "id" : "en";
        setLang(language);
        setUsername(info?.username ?? "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLanguageSwitch = (selected: "en" | "id") => {
    setLang(selected);
  };

  const handleSave = async () => {
    if (changePassword) {
      if (!currentPassword) {
        setShowAlert(true);
        setIsSuccess(false);
        setTitlePopup(t.master.error);
        setMessagePopup(t.profile.error_current_password_required);
        setTimeout(() => setShowAlert(false), 5000);
        return;
      }
      if (newPassword !== confirmPassword) {
        setShowAlert(true);
        setIsSuccess(false);
        setTitlePopup(t.master.error);
        setMessagePopup(t.profile.error_password_mismatch);
        setTimeout(() => setShowAlert(false), 5000);
        return;
      }
    }

    try {
      setLoading(true);
      await updateProfile({
        username,
        phone_number: phoneNumber,
        language: lang,
        ...(changePassword ? { current_password: currentPassword, new_password: newPassword } : {}),
      });

      setShowAlert(true);
      setIsSuccess(true);
      setTitlePopup(t.master.success);
      setMessagePopup(t.profile.success_update);
      setChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowAlert(false), 5000);
    } catch (err: any) {
      setShowAlert(true);
      setIsSuccess(false);
      setTitlePopup(t.master.error);
      setMessagePopup(err.message || t.master.error_msg);
      setTimeout(() => setShowAlert(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">{t.profile.title}</Heading>
      </Flex>

      {showAlert && <AlertMessage title={titlePopup} description={messagePopup} isSuccess={isSuccess} />}

      {/* Account Information */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">{t.profile.account_info}</Heading>
        </Card.Header>
        <Card.Body>
          <Flex direction="column" gap={4} maxW="480px">
            <Field.Root>
              <Field.Label>{t.profile.username}</Field.Label>
              <Input
                placeholder={t.profile.username_placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t.profile.phone_number}</Field.Label>
              <Input
                placeholder={t.profile.phone_number_placeholder}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field.Root>
          </Flex>
        </Card.Body>
      </Card.Root>

      {/* Language */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">{t.profile.language}</Heading>
        </Card.Header>
        <Card.Body>
          <Flex gap={3}>
            <Box
              as="button"
              onClick={() => handleLanguageSwitch("en")}
              display="flex"
              alignItems="center"
              gap={2}
              px={5}
              py={3}
              borderRadius="lg"
              border="2px solid"
              borderColor={lang === "en" ? "#E77A1F" : "gray.200"}
              bg={lang === "en" ? "orange.50" : "white"}
              color={lang === "en" ? "#E77A1F" : "gray.600"}
              fontWeight={lang === "en" ? "semibold" : "normal"}
              transition="all 0.15s"
              cursor="pointer"
              _hover={{ borderColor: "#E77A1F", color: "#E77A1F" }}
            >
              <Text fontSize="xl">🇬🇧</Text>
              <Text fontSize="sm">{t.profile.language_en}</Text>
            </Box>

            <Box
              as="button"
              onClick={() => handleLanguageSwitch("id")}
              display="flex"
              alignItems="center"
              gap={2}
              px={5}
              py={3}
              borderRadius="lg"
              border="2px solid"
              borderColor={lang === "id" ? "#E77A1F" : "gray.200"}
              bg={lang === "id" ? "orange.50" : "white"}
              color={lang === "id" ? "#E77A1F" : "gray.600"}
              fontWeight={lang === "id" ? "semibold" : "normal"}
              transition="all 0.15s"
              cursor="pointer"
              _hover={{ borderColor: "#E77A1F", color: "#E77A1F" }}
            >
              <Text fontSize="xl">🇮🇩</Text>
              <Text fontSize="sm">{t.profile.language_id}</Text>
            </Box>
          </Flex>
        </Card.Body>
      </Card.Root>

      {/* Change Password */}
      <Card.Root mb={6}>
        <Card.Header>
          <Flex justify="space-between" align="center">
            <Heading size="md">{t.profile.change_password}</Heading>
            <Button
              size="sm"
              variant={changePassword ? "solid" : "outline"}
              bg={changePassword ? "#E77A1F" : undefined}
              color={changePassword ? "white" : undefined}
              onClick={() => {
                setChangePassword((prev) => !prev);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              {changePassword ? t.master.cancel : t.profile.change_password}
            </Button>
          </Flex>
        </Card.Header>
        {changePassword && (
          <Card.Body>
            <Flex direction="column" gap={4} maxW="480px">
              <Field.Root>
                <Field.Label>{t.profile.current_password}</Field.Label>
                <Input
                  type="password"
                  placeholder={t.profile.current_password_placeholder}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.profile.new_password}</Field.Label>
                <Input
                  type="password"
                  placeholder={t.profile.new_password_placeholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>{t.profile.confirm_password}</Field.Label>
                <Input
                  type="password"
                  placeholder={t.profile.confirm_password_placeholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field.Root>
            </Flex>
          </Card.Body>
        )}
      </Card.Root>

      {/* Save */}
      <Flex justify="flex-end" mb={10}>
        <Button bg="#E77A1F" color="white" cursor="pointer" onClick={handleSave}>
          {t.profile.save_changes}
        </Button>
      </Flex>

      {/* Footer */}
      <Separator mb={4} />
      <Flex direction="column" align="center" gap={2} pb={6}>
        <a href="/privacy-policy" style={{ fontSize: "0.75rem", color: "#6B7280", textDecoration: "none" }}>
          {t.profile.privacy_policy}
        </a>
        <Text fontSize="xs" color="gray.400">
          {t.profile.version} 0.1.0
        </Text>
      </Flex>
    </SidebarWithHeader>
  );
}
