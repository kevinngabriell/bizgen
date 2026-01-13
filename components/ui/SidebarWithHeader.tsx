'use client'

import { Box, BoxProps, Button, CloseButton, Drawer, Flex, FlexProps, HStack, Icon, IconButton, Image, Text, useDisclosure, VStack, MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@chakra-ui/react"
import { ReactNode } from "react"
import { FiSettings, FiGrid, FiMenu, FiBell, FiLogOut } from 'react-icons/fi'
import { FaChartBar, FaCoins, FaDollarSign, FaFileAlt, FaShoppingBag, FaTruck, FaUserFriends } from 'react-icons/fa'
import { IconType } from "react-icons/lib"
import { useColorModeValue } from "./color-mode"
import { useRouter } from "next/navigation";

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

const LinkItems: Array<LinkItemProps> = [
  { name: 'Dashboard', icon: FiGrid, href: '/bizgen/dashboard' },
  { name: 'Sales', icon: FaDollarSign, href: '/bizgen/sales' },
  { name: 'Purchase', icon: FaShoppingBag, href: '/bizgen/purchase' },
  { name: 'Finance', icon: FaCoins, href: '/bizgen/finance' },
  { name: 'Warehouse', icon: FaTruck, href: '/bizgen/warehouse' },
  { name: 'HR', icon: FaUserFriends, href: '/bizgen/hr' },
  { name: 'Analytics', icon: FaChartBar, href: '/bizgen/analytics' },
  { name: 'Document', icon: FaFileAlt, href: '/bizgen/document' },
  { name: 'Settings', icon: FiSettings, href: '/bizgen/settings' },
]

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
    const router = useRouter();

    // Handles logout: remove token and redirect to login
    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return(
        <Box
            transition="3s ease"
            bg={useColorModeValue('white','gray.900')} 
            borderRight="1px"
            borderRightColor={useColorModeValue('gray.200', 'gray.700')}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            {...rest}
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
              <NavItem icon={FiLogOut} onClick={handleLogout}>Logout</NavItem>
            </Flex>

        </Box>
    )
}

const NavItem = ({ icon, children, href, ...rest }: NavItemProps) => {
    const router = useRouter();

    return(
        <Box 
            as="a" 
            // ref="#"
            onClick={() => {
                if (href) router.push(href);
            }}
            _focus={{ boxShadow: 'none' }} 
            style={{ textDecoration: 'none' }}
        >
            <Flex
                align="center"
                p="4"
                mx="4"
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
    const router = useRouter();
    const { open, onOpen: onOpenNotif, onClose: onCloseNotif } = useDisclosure()
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
                Nama Company
            </Text>

            <HStack textSpacingTrim={{ base: '0', md: '6' }}>
              {/* Notification menu — open on hover */}
              <Box
                position="relative"
                zIndex="dropdown"
                onMouseEnter={onOpenNotif}
                onMouseLeave={onCloseNotif}
              >
                <MenuRoot open={open}>
                  <MenuTrigger asChild>
                    <IconButton
                      size="lg"
                      variant="ghost"
                      aria-label="notifications"
                    >
                      <FiBell />
                    </IconButton>
                  </MenuTrigger>

                  {/* Unread badge */}
                  <Box
                    position="absolute"
                    top="0"
                    right="0"
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    px="2"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    3
                  </Box>

                  <MenuContent minW="280px" zIndex="popover" boxShadow="lg">
                    <MenuItem value="" fontWeight="semibold">Notifications</MenuItem>
                    <MenuSeparator />
                    <MenuItem value="">🔔 Unread notification 1</MenuItem>
                    <MenuItem value="">🔔 Unread notification 2</MenuItem>
                    <MenuItem value="">🔔 Unread notification 3</MenuItem>
                    <MenuItem value="">✓ Read notification 4</MenuItem>
                    <MenuItem value="">✓ Read notification 5</MenuItem>
                    <MenuSeparator />
                    <MenuItem value="" color="orange.500" fontWeight="medium">
                      See all notifications
                    </MenuItem>
                  </MenuContent>
                </MenuRoot>
              </Box>
                <Flex alignItems="center">
                  <HStack>
                    <VStack
                      display={{ base: 'none', md: 'flex' }}
                      alignItems="flex-start"
                      ml="2"
                      // spacing="1"
                    >
                      <Text fontSize="sm" onClick={handleProfile}>{username}</Text>
                      {typeof daysToExpire === "number" && (
                        <Box
                          px="2"
                          py="0.5"
                          borderRadius="md"
                          bg={daysToExpire <= 2 ? "red.500" : daysToExpire <= 7 ? "orange.400" : "gray.500"}
                          color="white"
                          fontSize="9px"
                          fontWeight="semibold"
                        >
                          {daysToExpire > 0
                            ? `Subscription expires in ${daysToExpire} day${daysToExpire === 1 ? "" : "s"}`
                            : "Subscription expired"}
                        </Box>
                      )}
                    </VStack>
                  </HStack>
                </Flex>
            </HStack>
        </Flex>
    )
}

const SidebarWithHeader = ({ username, children, daysToExpire }: SidebarWithHeaderProps) => {
  const { open, onOpen, onClose } = useDisclosure()

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')} width="100vw">
      <SidebarContent onClose={onClose} display={{ base: 'none', md: 'block' }} />
        <Drawer.Root open={open} placement={"start"} size="full" > 
            <Drawer.Content>
                <SidebarContent onClose={onClose} />
            </Drawer.Content>
        </Drawer.Root>

        <MobileNav onOpen={onOpen} username={username} daysToExpire={daysToExpire} />
        <Box ml={{ base: 0, md: 60 }} p="4">
            {children}
        </Box>
    </Box>
  )
}

export default SidebarWithHeader