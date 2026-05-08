'use client'

import { Box, BoxProps, CloseButton, Drawer, Flex, FlexProps, HStack, Icon, IconButton, Image, Text, useDisclosure, VStack, MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@chakra-ui/react"
import { ReactNode, useState } from "react"
import { FiSettings, FiGrid, FiMenu, FiBell, FiLogOut } from 'react-icons/fi'
import { FaChartBar, FaCoins, FaDollarSign, FaFileAlt, FaShoppingBag, FaTruck, FaUserFriends } from 'react-icons/fa'
import { IconType } from "react-icons/lib"
import { useColorModeValue } from "./color-mode"
import { useRouter } from "next/navigation";
import { getLang } from "@/lib/i18n"

interface LinkItemProps {
  name: string
  icon: IconType
  href?: string
}

interface NavItemProps extends FlexProps {
  icon: IconType
  children: ReactNode
  href?: string
}

interface MobileProps extends FlexProps {
  onOpen: () => void
  username: string
  daysToExpire?: number
}

interface SidebarProps extends BoxProps {
  onClose: () => void
}

interface SidebarWithHeaderProps {
  children: ReactNode
  title?: string
  username: string
  onLogout?: () => void
  daysToExpire?: number
}

const t = getLang("en"); 

const LinkItems: Array<LinkItemProps> = [
  { name: `${t.sidebar_menu.dashboard}`, icon: FiGrid, href: '/bizgen/dashboard' },
  { name: `${t.sidebar_menu.sales}`, icon: FaDollarSign, href: '/bizgen/sales' },
  { name: `${t.sidebar_menu.purchase}`, icon: FaShoppingBag, href: '/bizgen/purchase' },
  { name: `${t.sidebar_menu.finance}`, icon: FaCoins, href: '/bizgen/finance' },
  { name: `${t.sidebar_menu.warehouse}`, icon: FaTruck, href: '/bizgen/warehouse' },
  { name: `${t.sidebar_menu.hr}`, icon: FaUserFriends, href: '/bizgen/hr' },
  { name: `${t.sidebar_menu.analytics}`, icon: FaChartBar, href: '/bizgen/analytics' },
  { name: `${t.sidebar_menu.document}`, icon: FaFileAlt, href: '/bizgen/document' },
  { name: `${t.sidebar_menu.settings}`, icon: FiSettings, href: '/bizgen/settings' },
]

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
    const router = useRouter();

    // Handles logout: remove token and redirect to login
    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return(
        <Box transition="3s ease"
            bg={useColorModeValue('white','gray.900')}  borderRight="1px"
            borderRightColor={useColorModeValue('gray.200', 'gray.700')} w={{ base: 'full', md: 60 }}
            pos="fixed" h="full" {...rest}
        >
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between"> 
                <Image src={"/assets/logo.png"} w={"30%"} />
                <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
            </Flex>

            {LinkItems.map((link) => (
                <NavItem key={link.name} icon={link.icon} href={link.href}>
                {link.name}
                </NavItem>
            ))}

            <Flex position="absolute" bottom="0" minW={"100%"}>
              <NavItem icon={FiLogOut} onClick={handleLogout}>{t.sidebar_menu.logout}</NavItem>
            </Flex>

        </Box>
    )
}

const NavItem = ({ icon, children, href, ...rest }: NavItemProps) => {
    const router = useRouter();

    return(
        <Box as="a" 
            // ref="#"
            onClick={() => {
                if (href) router.push(href);
            }}
            _focus={{ boxShadow: 'none' }} 
            style={{ textDecoration: 'none' }}
        >
            <Flex align="center"
                p={3.5}
                mx={4}
                borderRadius="lg"
                role="group"
                cursor="pointer"
                _hover={{
                    bg: '#E77A1F',
                    color: 'white',
                }}
                {...rest}
            >
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="16"
                        _groupHover={{
                        color: 'white',
                        }}
                        as={icon}
                    />
                    )}
                {children}
            </Flex>
        </Box>
    )
}

const MobileNav = ({ onOpen, username, daysToExpire, ...rest }: MobileProps) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const router = useRouter();
    
    const handleProfile = () => {
        router.push('/bizgen/profile');
    }

    return(
        <Flex
            ml={{ base: 0, md: 60 }}
            px={{ base: 1, md: 4 }}
            height="16"
            alignItems="center"
            bg={useColorModeValue('white', 'gray.900')}
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent={{ base: 'space-between', md: 'flex-end' }}
            {...rest}
        >
            <IconButton display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="outline"
                aria-label="open menu">
                    <FiMenu/>
            </IconButton>
            <Text display={{ base: 'flex', md: 'none' }} fontSize="1xl" fontWeight="bold">
                {t.header.company_name}
            </Text>

           <HStack columns={{ base: 1, md: 4 }} position="relative" gap={5}>
                {/* Notification bell with hover dropdown */}
                <Box position="relative">
                    <Box onMouseEnter={() => setShowNotifications(true)}>
                        <IconButton size="lg" variant="ghost" aria-label="notifications">
                            <FiBell />
                        </IconButton>
                    </Box>
                    {showNotifications && (
                        <Box
                            position="absolute"
                            right={0}
                            mt={2}
                            w="260px"
                            bg={useColorModeValue('white', 'gray.800')}
                            boxShadow="md"
                            borderRadius="md"
                            p={3}
                            zIndex={20}
                            onMouseLeave={() => setShowNotifications(false)}
                        >
                            <Text fontWeight="semibold" mb={2} fontSize="sm">
                                {t.header.notifications}
                            </Text>
                            <VStack align="flex-start" gap={1}>
                                <Text fontSize="xs" color="gray.500">
                                    {t.header.no_notifications}
                                </Text>
                            </VStack>
                        </Box>
                    )}
                </Box>

                {/* Profile / user menu with hover dropdown */}
                <Box position="relative">
                    <Flex alignItems="center" cursor="pointer" onMouseEnter={() => setShowProfileMenu(true)}>
                        {/* Avatar inisial */}
                        <Box
                            display={{ base: 'none', md: 'flex' }}
                            w="8"
                            h="8"
                            borderRadius="full"
                            bg={useColorModeValue('gray.200', 'gray.700')}
                            alignItems="center"
                            justifyContent="center"
                            mr={2}
                        >
                            <Text fontSize="xs" fontWeight="bold">
                                {username ? username.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </Box>
                        <VStack display={{ base: 'none', md: 'flex' }} alignItems="flex-start" gap={0} ml="1" >
                            <Text fontSize="sm">{username}</Text>
                        </VStack>
                    </Flex>
                    {showProfileMenu && (
                        <Box
                            position="absolute"
                            right={0}
                            mt={2}
                            w="180px"
                            bg={useColorModeValue('white', 'gray.800')}
                            boxShadow="md"
                            borderRadius="md"
                            py={2}
                            zIndex={20}
                            onMouseLeave={() => setShowProfileMenu(false)}
                        >
                            <Box px={4} py={2} _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }} cursor="pointer">
                                <Text fontSize="sm" onClick={handleProfile}>{t.header.account}</Text>
                            </Box>
                            <Box px={4} py={2} _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }} cursor="pointer">
                                <Text fontSize="sm">{t.header.settings}</Text>
                            </Box>
                            <Box px={4} py={2} _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }} cursor="pointer" >
                                <Text fontSize="sm">{t.header.logout}</Text>
                            </Box>
                        </Box>
                    )}
                </Box>
            </HStack>
        </Flex>
    )
}

const SidebarWithHeader = ({ username, children, daysToExpire }: SidebarWithHeaderProps) => {
  const { open, onOpen, onClose } = useDisclosure()

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')} maxW="100vw" w={"100%"} overflowX="hidden">
      <SidebarContent onClose={onClose} display={{ base: 'none', md: 'block' }} />
        <Drawer.Root open={open} placement={"start"} size="full" > 
            <Drawer.Content>
                <SidebarContent onClose={onClose} />
            </Drawer.Content>
        </Drawer.Root>

        <MobileNav onOpen={onOpen} username={username} daysToExpire={daysToExpire} />
        <Box ml={{ base: 0, md: 60 }} p="4" overflowX="auto" maxW="100%">
            {children}
        </Box>
    </Box>
  )
}

export default SidebarWithHeader