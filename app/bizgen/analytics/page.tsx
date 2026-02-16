"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken, checkAuthOrRedirect, getAuthInfo } from "@/lib/auth/auth";
import { Box, Flex, Heading, SimpleGrid, Text, Card, Stack, Badge } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Analytics() {
  const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const valid = await checkAuthOrRedirect();
    if(!valid) return;

    const info = getAuthInfo();
    setAuth(info);

    try {

    } catch (error: any){

    } finally {
      setLoading(false);
    }
  }
    
  if (loading) return <Loading/>;


  return (
    <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
      <Flex direction="column" gap={6} p={4}>
        <Heading size="lg">Analytics Overview</Heading>

        {/* Summary Section */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Card.Root>
            <Card.Header>
              <Heading size="sm">Top Product</Heading>
            </Card.Header>
            <Card.Body>
              <Text fontSize="2xl" fontWeight="bold">—</Text>
              <Text color="gray.500" fontSize="sm">Most purchased product this period</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="sm">Top Country</Heading>
            </Card.Header>
            <Card.Body>
              <Text fontSize="2xl" fontWeight="bold">—</Text>
              <Text color="gray.500" fontSize="sm">Highest import / export volume</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="sm">Top Buyer</Heading>
            </Card.Header>
            <Card.Body>
              <Text fontSize="2xl" fontWeight="bold">—</Text>
              <Text color="gray.500" fontSize="sm">Most active customer</Text>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Charts Section */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          <Card.Root>
            <Card.Header>
              <Heading size="sm">Top Purchased Products</Heading>
            </Card.Header>
            <Card.Body>
              <Box
                border="1px dashed"
                borderColor="gray.300"
                borderRadius="md"
                h="260px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="gray.400">[ Bar Chart Placeholder ]</Text>
              </Box>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="sm">Purchases by Country</Heading>
            </Card.Header>
            <Card.Body>
              <Box
                border="1px dashed"
                borderColor="gray.300"
                borderRadius="md"
                h="260px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="gray.400">[ Map / Pie Chart Placeholder ]</Text>
              </Box>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Buyer Insights */}
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Buyer Insights</Heading>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
              <Flex justify="space-between">
                <Text>Top Repeat Buyer</Text>
                <Badge colorScheme="green">—</Badge>
              </Flex>

              <Flex justify="space-between">
                <Text>Most Purchased Category</Text>
                <Badge colorScheme="purple">—</Badge>
              </Flex>

              <Flex justify="space-between">
                <Text>Average Order Value</Text>
                <Badge colorScheme="blue">—</Badge>
              </Flex>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Flex>
    </SidebarWithHeader>
  );
}