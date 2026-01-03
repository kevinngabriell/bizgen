'use client';

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useColorModeValue } from './color-mode';

const TopNavbar = () => {
  const router = useRouter();
  const { open, onToggle } = useDisclosure();

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
      <Flex
        px={{ base: 4, md: 8 }}
        height="20"
        alignItems="center"
        bg={useColorModeValue('white', 'gray.900')}
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        justifyContent="space-between"
      >
        {/* Logo kiri */}
        <HStack gap={3} align="center">
          <Image
            src="/raki.png"
            alt="RAKI"
            w={{ base: '30%', sm: '48px', md: '60px' }}
            h="auto"
            objectFit="contain"
          />
          {/* <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
            RAKI
          </Text> */}
        </HStack>

        {/* Mobile menu button */}
        <IconButton
          aria-label="Toggle navigation"
          variant="ghost"
          display={{ base: 'flex', md: 'none' }}
          onClick={onToggle}
        >
          <span style={{ fontSize: '20px' }}>&#9776;</span>
        </IconButton>

        {/* Desktop navigation */}
        <HStack
          gap={{ base: 4, md: 6 }}
          align="center"
          display={{ base: 'none', md: 'flex' }}
        >
          <Text
            fontSize="sm"
            cursor="pointer"
            color={"black"}
            _hover={{ color: 'orange.500' }}
            onClick={() => scrollToId('home-section')}
          >
            Home
          </Text>
          <Text
            fontSize="sm"
            cursor="pointer"
            color={"black"}
            _hover={{ color: 'orange.500' }}
            onClick={() => scrollToId('package-section')}
          >
            Paket
          </Text>
          {/* <Text
            fontSize="sm"
            cursor="pointer"
            color={"black"}
            _hover={{ color: 'orange.500' }}
            onClick={() => scrollToId('menu-section')}
          >
            Menu
          </Text>
          <Text
            fontSize="sm"
            cursor="pointer"
            color={"black"}
            _hover={{ color: 'orange.500' }}
            onClick={() => scrollToId('franchise-section')}
          >
            Franchise
          </Text> */}

          <Box>
            <Text
              as="button"
              px={4}
              py={2}
              borderRadius="10px"
              bg="#E77A1F" color="white"
              fontSize="sm"
              _hover={{ opacity: 0.9 }}
              onClick={handleLogin}
              cursor="pointer"
            >
              Login
            </Text>
          </Box>
        </HStack>
      </Flex>

      {open && (
        <Box
          bg={useColorModeValue('white', 'gray.900')}
          borderBottomWidth="1px"
          borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
          px={4}
          py={3}
          display={{ md: 'none' }}
        >
          <VStack gap={3} align="stretch">
            <Text
              cursor="pointer"
              onClick={() => {
                onToggle();
                scrollToId('home-section');
              }}
            >
              Home
            </Text>
            <Text
              cursor="pointer"
              onClick={() => {
                onToggle();
                scrollToId('abang-section');
              }}
            >
              Abang
            </Text>
            <Text
              cursor="pointer"
              onClick={() => {
                onToggle();
                scrollToId('menu-section');
              }}
            >
              Menu
            </Text>
            <Text
              cursor="pointer"
              onClick={() => {
                onToggle();
                scrollToId('franchise-section');
              }}
            >
              Franchise
            </Text>
            <Box pt={2}>
              <Text
                as="button"
                w="full"
                textAlign="center"
                px={4}
                py={2}
                borderRadius="10px"
                bg="#42342B"
                color="white"
                fontSize="sm"
                _hover={{ bg: 'gray.800' }}
                onClick={() => {
                  onToggle();
                  handleLogin();
                }}
              >
                Login
              </Text>
            </Box>
          </VStack>
        </Box>
      )}
    </>
  );
};

export default TopNavbar;