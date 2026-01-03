"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Heading } from "@chakra-ui/react";

export default function SettingUsers(){
    return(
        <SidebarWithHeader username="kevin">
            <Heading>User</Heading>
        </SidebarWithHeader>
    );
}