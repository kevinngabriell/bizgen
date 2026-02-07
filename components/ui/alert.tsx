"use client";

import { AlertContent, AlertDescription, AlertIndicator, AlertRoot, AlertTitle } from "@chakra-ui/react";
import { useState } from "react";

export function AlertMessage({ title, description, isSuccess }: { title: string; description: string; isSuccess: boolean; }) {
  return (
    <AlertRoot status={isSuccess ? "success" : "error"} marginBottom={8}>
      <AlertIndicator />
      <AlertContent>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </AlertContent>
    </AlertRoot>
  );
}