'use client'

import { Flex, Spinner } from "@chakra-ui/react";

const Loading = ({}) => {
    return(
        <Flex justify="center" align="center" width="full">
            <Spinner size="xl"/>
        </Flex>
    );
}

export default Loading;