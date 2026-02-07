"use client";

import { useState } from "react";
import { Box, Button, Flex, Heading, Input, InputGroup, SimpleGrid, Stack, Text, Field, Steps, ButtonGroup, Badge, Textarea } from "@chakra-ui/react";
import { LuLock } from "react-icons/lu";
import { PasswordInput } from "@/components/ui/password-input";
import { getLang } from "@/lib/i18n";

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [companyCode, setCompanyCode] = useState('');

  const t = getLang("en"); 

  const [plan, setPlan] = useState<'Starter' | 'Growth' | 'Enterprise' | ''>('');

  const passwordHint = () => {
    if (!password) return null;
    if (password.length < 8) return "Minimal 8 karakter";
    if (!/[a-z]/.test(password)) return "Harus mengandung huruf kecil";
    if (!/[A-Z]/.test(password)) return "Harus mengandung huruf besar";
    if (!/[0-9]/.test(password)) return "Harus mengandung angka";
    return null;
  };

  const onNext = () => {
        // if (!canGoNext()) {
        //     if (activeStep === 1 && password && !isStrongPassword(password)) {
        //         setAlert({
        //           title: "Password tidak valid !!",
        //           description: "Password harus mengandung 8 karakter, huruf besar, huruf kecil, dan angka.",
        //         });
        //     }
        //     return;
        // }
        setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onPrev = () => {
        setActiveStep((s) => {
            const next = Math.max(s - 1, 0);
            if (next === 0) {
                // optional reset for role-dependent fields
                // setPlan('');
                // setCompanyCode('');
                // setBusinessName('');
                // setBusinessCategory('');
                // setBusinessAddress('');
            }
            return next;
        });
  };

  const canGoNext = () => {
        // if (activeStep === 0) {
        //     return isOwner !== null;
        // }
        // if (activeStep === 1) {
        //     // base account always required
        //     if (!username.trim() || !password.trim()) return false;
        //     if (!isStrongPassword(password)) return false;

        //     if (isOwner === true) {
        //         return !!businessName.trim() && !!businessCategory.trim() && !!businessAddress.trim();
        //     }
        //     // non-owner
        //     return !!companyCode.trim();
        // }
        // if (activeStep === 2) {
        //     if (isOwner === true) return plan === 'basic';
        //     return true;
        // }
        return true;
  };

  const onRegister = () => {}

  return (
    <Flex w="100vw" minH="100vh" bg="white" bgGradient="linear(to-br, #FFF7ED, #FFE6C9)" align="center" justify="center" p={{ base: 6, md: 10 }}>
      <Box w="70%" maxW="100vw" bg="white" rounded="2xl" shadow="lg" p={{ base: 6, md: 10 }}>
        {/* Title */}
        <Flex flexDir={"column"} gap={2} mb={8} alignItems={"center"}>
          <Heading size="lg" color={"gray.800"}>{t.register.title}</Heading>
          <Text color="gray.600">{t.register.description}</Text>
        </Flex>

        
        <Steps.Root defaultStep={0} count={steps.length} step={activeStep} onStepChange={(details) => setActiveStep(details.step)} colorPalette={"orange"} >
          <Steps.List>
            {steps.map((s, index) => (
              <Steps.Item key={index} index={index} title={s.title}>
                <Steps.Indicator/>
                <Steps.Title color={"black"}>{s.title}</Steps.Title>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>
          
          {/* Steps 1 -> Role  */}
          <Steps.Content index={0}>
            <Text fontWeight="semibold" color={"black"} mb={6}>{t.register.step_one_title}</Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {/* Business Owner Box */}
              <Box p={5} borderWidth="1px" borderRadius="xl" cursor="pointer" bg={isOwner === true ? 'orange.40' : 'white'} borderColor={isOwner === true ? 'orange.400' : 'gray.200'} onClick={() => { setIsOwner(true); setActiveStep(1);}}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="bold" color={"black"}>{t.register.step_one_card_1}</Text>
                  {isOwner === true && <Badge colorPalette="orange">{t.register.step_one_card_selected}</Badge>}
                </Flex>
                <Text fontSize="sm" color="gray.600">{t.register.step_one_card_2}</Text>
              </Box>

              {/* Employee Owner Box */}
              <Box p={5} borderWidth="1px" borderRadius="xl" cursor="pointer" bg={isOwner === false ? 'orange.40' : 'white'} borderColor={isOwner === false ? 'orange.400' : 'gray.200'} onClick={() => { setIsOwner(false); setActiveStep(1); }}>
                <Flex justify="space-between" align="center" mb={2}>
								  <Text fontWeight="bold" color={"black"}>{t.register.step_one_card_3}</Text>
								  {isOwner === false && <Badge colorPalette="orange">{t.register.step_one_card_selected}</Badge>}
                </Flex>
                <Text fontSize="sm" color="gray.600">{t.register.step_one_card_4}</Text>
              </Box>
            </SimpleGrid>
          </Steps.Content>
          
          {/* Steps 2 -> Personal Information  */}
          <Steps.Content index={1}>
            <Text mt={6} mb={4} fontWeight={"semibold"}>{t.register.step_two_title}</Text>

            {/* Username Field */}
            <Field.Root mb={7}>
              <Field.Label>{t.login.username}</Field.Label>
              <Input placeholder={t.login.username_placeholder} value={username} onChange={(e) => setUsername(e.target.value)}/>
            </Field.Root>

            {/* Password Field */}
            <Field.Root mb={7} invalid={!!passwordHint()}>
              <Field.Label>{t.login.password}</Field.Label>
              <InputGroup startElement={<LuLock />}>
                <PasswordInput placeholder={t.login.password_placeholder} value={password} onChange={(e) => setPassword(e.target.value)}/>
              </InputGroup>

              {/* Password Hint */}
              {passwordHint() && (
                <Field.ErrorText>{passwordHint()}</Field.ErrorText>
              )}
            </Field.Root>
            
            {/* Whatsapp number field */}
            <Field.Root mb={7}>
              <Field.Label>{t.register.step_two_wa}</Field.Label>
              <Input placeholder={t.register.step_two_wa_placeholder} value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}/>
            </Field.Root>

            {isOwner === true ? (
              // if role choosen was owner
              <>
                <SimpleGrid columns={{base: 1, md: 1, lg: 2}} gap={"20px"}>
                  <Field.Root mb={5}>
                    <Field.Label mb={2}>{t.register.step_two_card_1}</Field.Label>
                    <Input placeholder={t.register.step_two_card_1_placeholder} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </Field.Root>
                                        
                  <Field.Root mb={5}>
                    <Field.Label mb={2}>{t.register.step_two_card_2}</Field.Label>
                    <Input placeholder={t.register.step_two_card_2_placeholder} value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} />
                  </Field.Root>
                </SimpleGrid>

                <Field.Root mb={2}>
                  <Field.Label mb={2}>{t.register.step_two_card_3}</Field.Label>
                  <Textarea placeholder={t.register.step_two_card_3_placeholder} value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                </Field.Root>
              </>
             ) : (
               // if role choosen was employee
                <Field.Root mb={2}>
                  <Field.Label mb={2}>{t.register.step_two_card_4}</Field.Label>
                  <Input placeholder={t.register.step_two_card_4_placeholder} value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} />
                </Field.Root>
             )}
          </Steps.Content>

          <Steps.Content index={2}>
            {isOwner === true ? (
              <>
                <Text mt={6} mb={4} fontWeight={"semibold"}>Pilih paket</Text>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
                  {pricingPlans.map((p) => (
                    <Box key={p.value} position="relative" p={6} borderWidth="1px" borderRadius="2xl" cursor={p.enabled ? 'pointer' : 'not-allowed'} onClick={() => p.enabled && setPlan(p.value)} transition="all 0.18s ease" transform={p.enabled ? 'translateY(0px)' : 'none'} _hover={ p.enabled? { transform: 'translateY(-3px)', boxShadow: 'lg', borderColor: 'orange.500'} : {}} boxShadow={plan === p.value ? 'lg' : 'sm'} borderColor={plan === p.value ? 'orange.500' : 'gray.200'} bg={ p.value === 'Starter' ? plan === p.value ? 'orange.50' : 'white' : 'white' } _before={ p.value === 'Starter' ? { content: '""', position: 'absolute', inset: 0, borderRadius: '2xl', background: 'linear-gradient(135deg, rgba(49,151,149,0.12), rgba(49,151,149,0))', pointerEvents: 'none' } : undefined} filter={p.enabled ? 'none' : 'grayscale(0.2)'}>
                    
                      {!p.enabled && (
                        <Box position="absolute" top={3} right={3} px={3} py={1} borderRadius="full" bg="gray.100"borderWidth="1px" borderColor="gray.200" fontSize="xs" fontWeight="semibold" color="gray.600"> Coming Soon </Box>
                      )}

                      <Flex justify="space-between" align="start" mb={3} position="relative">
                        <Box>
                          <Text fontSize="xl" fontWeight="bold" lineHeight={1.2}> {p.label}</Text>
                          
                          {p.value === 'Starter' && (
                            <Text fontSize="xs" color="orange.700" fontWeight="semibold" mt={1}> Recommended untuk mulai </Text>
                          )}
                        </Box>
                      </Flex>

                      <Box mb={4} position="relative">
                        <Text fontSize="sm" color="gray.600">{p.price}</Text>
                        {/* <Text fontSize="lg" fontWeight="bold" color={p.enabled ? 'orange.700' : 'gray.600'}> {p.enabled ? 'Gratis (Free Trial)' : 'Segera hadir'} </Text> */}
                        <Text fontSize="xs" color="gray.500" mt={1}> {p.enabled ? 'Coba dulu sebelum upgrade.' : 'Plan ini akan dibuka saat launch.'}</Text>
                      </Box>

                      <Stack gap={2} fontSize="sm" color={p.enabled ? 'gray.800' : 'gray.600'} position="relative">
                        {p.features.map((f, idx) => (
                          <Text key={idx}>• {f}</Text>
                        ))}
                      </Stack>

                      {plan === p.value && (
                        <Box mt={5} borderRadius="xl" bg="orange.600" color="white" textAlign="center" py={2} fontWeight="bold" fontSize="sm" position="relative"> Dipilih </Box>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>

                <Button mt={8} w="100%" colorScheme="orange" onClick={onRegister} disabled={!canGoNext()}>
                  Mulai Free Trial
                </Button>
              </>
            ) : (
						  //employee area 
              <>
                <Text mt={6} mb={2} fontWeight={"semibold"}>Review</Text>
                <Text fontSize="sm" color="gray.600">Akun kamu akan terhubung ke company menggunakan kode yang kamu input.</Text>

                <Box mt={5} p={4} borderWidth="1px" borderRadius="xl">
                  <Text fontSize="sm"><b>{t.login.username}</b> {username || '-'}</Text>
                  <Text fontSize="sm"><b>{t.register.step_two_card_4}</b> {companyCode || '-'}</Text>
                </Box>

                <Button mt={8} w="100%" colorScheme="orange" onClick={onRegister}>
                  Register
                </Button>
              </>
            )}
          </Steps.Content>

          {activeStep > 0 && (
            <ButtonGroup size="sm" variant="outline" mt={8} w="100%">
              <Button onClick={onPrev} disabled={activeStep === 0}>Prev</Button>
              <Button onClick={onNext} disabled={activeStep === steps.length - 1 || !canGoNext()}>Next</Button>
            </ButtonGroup>
          )}

        </Steps.Root>

        
      </Box>
    </Flex>
  );
}

const steps = [
    { title: "Role" },
    { title: "Details" },
    { title: "Finish" },
];

type PlanValue = 'Starter' | 'Growth' | 'Enterprise'

type PricingPlan = {
  value: PlanValue;
  label: string;
  price: string;
  badge: string;
  enabled: boolean;
  features: string[];
};

const pricingPlans: PricingPlan[] = [
  {
    value: 'Starter',
    label: 'Starter',
    price: 'Rp 250.000 / bulan',
    badge: '',
    enabled: true,
    features: [

    ]
  },
  {
    value: 'Growth',
    label: 'Growth',
    price: 'Rp 350.000 / bulan',
    badge: 'Most Popular',
    enabled: true,
    features: [
      
    ]
  },
  {
    value: 'Enterprise',
    label: 'Enterprise',
    price: 'Rp 500.000 / bulan',
    badge: '',
    enabled: true,
    features: [
      
    ]
  }
]