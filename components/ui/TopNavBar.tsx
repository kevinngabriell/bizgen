'use client';

import {Box, Button, Flex, HStack, IconButton, Image, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useColorModeValue } from './color-mode';
import { getLang } from '@/lib/i18n';

const TopNavbar = () => {
  const router = useRouter();
  const { open, onToggle } = useDisclosure();
  const t = getLang("en"); 

  const scrollToId = (id: string) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <>
      <Flex px={{ base: 4, md: 8 }} height="20" alignItems="center" bg={useColorModeValue('white', 'gray.900')} borderBottomWidth="1px" borderBottomColor={useColorModeValue('gray.200', 'gray.700')} justifyContent="space-between">
        {/* Logo kiri */}
        <HStack gap={3} align="center">
          <Image src="/assets/logo.png" alt="Bizgen" w={{ base: '30%', sm: '48px', md: '60px' }} h="auto" objectFit="contain"/>
        </HStack>

        {/* Mobile menu button */}
        <IconButton aria-label="Toggle navigation" variant="ghost" display={{ base: 'flex', md: 'none' }} onClick={onToggle}>
          <span style={{ fontSize: '20px' }}>&#9776;</span>
        </IconButton>

        {/* Desktop navigation */}
        <HStack gap={{ base: 4, md: 6 }} align="center" display={{ base: 'none', md: 'flex' }}>
          <Text fontSize="sm" cursor="pointer" color={"black"} _hover={{ color: 'orange.500' }} onClick={() => scrollToId('home-section')}>{t.dashboard.topbar_home}</Text>
          <Text fontSize="sm" cursor="pointer" color={"black"} _hover={{ color: 'orange.500' }} onClick={() => scrollToId('package-section')}>{t.dashboard.topbar_package}</Text>
          <Button fontSize="sm" bg="#E77A1F" borderRadius="10px" color="white" _hover={{ opacity: 0.9 }} onClick={handleLogin}>{t.dashboard.topbar_login}</Button>
        </HStack>
      </Flex>

      {open && (
        <Box bg={useColorModeValue('white', 'gray.900')} borderBottomWidth="1px" borderBottomColor={useColorModeValue('gray.200', 'gray.700')} px={4} py={3} display={{ md: 'none' }}>
          <VStack gap={3} align="stretch">
            <Text fontSize="sm" cursor="pointer" color={"black"} _hover={{ color: 'orange.500' }} onClick={() => scrollToId('home-section')}>{t.dashboard.topbar_home}</Text>
            <Text fontSize="sm" cursor="pointer" color={"black"} _hover={{ color: 'orange.500' }} onClick={() => scrollToId('package-section')}>{t.dashboard.topbar_package}</Text>
            <Button fontSize="sm" bg="#E77A1F" borderRadius="10px" color="white" _hover={{ opacity: 0.9 }} onClick={handleLogin}>{t.dashboard.topbar_login}</Button>
          </VStack>
        </Box>
      )}
    </>
  );
};

export default TopNavbar;