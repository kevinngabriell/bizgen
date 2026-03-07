"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { DecodedAuthToken } from "@/lib/auth/auth";
import { Flex } from "@chakra-ui/react";
import { useState } from "react";

export default function StockReport() {
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    <SidebarWithHeader username="" daysToExpire={0}>
        <Flex>
            
        </Flex>
    </SidebarWithHeader>
}