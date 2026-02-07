"use client";

import Loading from "@/components/loading";
import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { checkAuthOrRedirect, DecodedAuthToken, getAuthInfo } from "@/lib/auth/auth";
import { getLang } from "@/lib/i18n";
import { Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function SettingUsers(){
    const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [loading, setLoading] = useState(false);

    const t = getLang("en"); 
    
    const init = async () => {
        setLoading(true);

        const valid = await checkAuthOrRedirect();
        if(!valid) return;
        
        const info = getAuthInfo();
        setAuth(info);

        setLoading(false);
    }

    useEffect(() => {
        init();
    }, []);

    if(loading) return <Loading/>    
    
    return(
        <SidebarWithHeader username={auth?.username ?? "Unknown"} daysToExpire={auth?.days_remaining ?? 0}>
            <Heading>User</Heading>
        </SidebarWithHeader>
    );
}