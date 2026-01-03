"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, Card, Field, Flex, Heading, Input, Tabs, Textarea } from "@chakra-ui/react";
import { useState } from "react";
import CompanyTargetDialog from "./companytargetdialog";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

export default function SettingCompany(){
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyIndustry, setCompanyIndustry] = useState('');
    const [companyPackage, setCompanyPackage] = useState('');
    const [companyId, setCompanyId] = useState('');

    const chartData = [
        { year: 2021, target: 5000, fill: "var(--color-safari)" },
        { year: 2022, target: 10000, fill: "var(--color-safari)" },
        { year: 2023, target: 5000, fill: "var(--color-safari)" },
        { year: 2024, target: 10000, fill: "var(--color-safari)" },
        { year: 2025, target: 5000, fill: "var(--color-safari)" },
        { year: 2026, target: 10000, fill: "var(--color-safari)" },
        { year: 2027, target: 5000, fill: "var(--color-safari)" },
        { year: 2028, target: 10000, fill: "var(--color-safari)" },
    ]

    const chartConfig = {
        visitors: {
            label: "Visitors",
        },
        safari: {
            label: "Safari",
            color: "var(--chart-2)",
        },
     } satisfies ChartConfig

     const handleUpdateCompany = async () => {
        
     }
    
    return(
        <SidebarWithHeader username="kevin">
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Company Settings</Heading>
                <CompanyTargetDialog triggerIcon={<Button bg={"#E77A1F"}>Create New Company Target</Button>} title="New Target"/>
            </Flex>

            <Card.Root>
                <Card.Body>
                    <Tabs.Root defaultValue="company-information">
                        <Tabs.List>
                            <Tabs.Trigger value="company-information">
                                Company Information
                            </Tabs.Trigger>

                            <Tabs.Trigger value="company-target">
                                Company Target
                            </Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content value="company-information">
                            <Flex gap={8} display={"flex"} mb={"2"} mt={"2"} direction={{ base: "column", md: "row" }}>
                                <Field.Root>
                                    <Field.Label>
                                        Company Name
                                    </Field.Label>
                                    <Input type="text" value={companyName || ""} onChange={(e) => setCompanyName(e.target.value)} placeholder="Input your company name"/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>
                                        Phone Number
                                    </Field.Label>
                                    <Input type="text" value={companyPhone || ""} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="Input your company phone number"/>
                                </Field.Root>
                            </Flex>

                            <Flex gap={8} display={"flex"} mb={"2"} mt={"8"} direction={{ base: "column", md: "row" }}>
                                <Field.Root>
                                    <Field.Label>
                                        Website
                                    </Field.Label>
                                    <Input type="text" value={companyWebsite || ""} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="Input your company website"/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>
                                        Email
                                    </Field.Label>
                                    <Input type="email" value={companyEmail || ""} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="Input your email"/>
                                </Field.Root>
                            </Flex>

                            <Flex gap={8} display={"flex"} mb={"2"} mt={"8"} direction={{ base: "column", md: "row" }}>
                                <Field.Root>
                                    <Field.Label>
                                        Address
                                    </Field.Label>
                                    <Textarea value={companyAddress || ""} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Input your company address"/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>
                                        Industry
                                    </Field.Label>
                                    <Input type="text" value={companyIndustry || ""} onChange={(e) => setCompanyIndustry(e.target.value)} placeholder="Input your company industry"/>
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>
                                        Package
                                    </Field.Label>
                                    <Input type="text" value={companyPackage || ""} readOnly placeholder="Input your company industry"/>
                                </Field.Root>
                            </Flex>

                            <Flex justify="end" mt={6}>
                                <Button onClick={handleUpdateCompany}>Update</Button>
                            </Flex>

                        </Tabs.Content>

                        <Tabs.Content value="company-target">
                            <Flex wrap="wrap" gap={4}>
                                {chartData.map((item) => (
                                    <Card.Root key={item.year}>
                                    <Card.Header>
                                        <Heading size="sm">Year: {item.year}</Heading>
                                    </Card.Header>
                                    <Card.Body>
                                        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                                            <RadialBarChart data={chartData} startAngle={0} endAngle={250} innerRadius={80} outerRadius={110}>
                                                <PolarGrid gridType="circle" radialLines={false} stroke="none" className="first:fill-muted last:fill-background" polarRadius={[86, 74]} />
                                                    <RadialBar dataKey="target" background cornerRadius={10} />
                                                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                                    <Label content={({ viewBox }) => {
                                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                            return (
                                                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-4xl font-bold">
                                                                    {chartData[0].target}
                                                                </tspan>
                                                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                                                                    Visitors
                                                                </tspan>
                                                            </text>
                                                            )
                                                        }
                                                    }}/>
                                                </PolarRadiusAxis>
                                            </RadialBarChart>
                                        </ChartContainer>
                                    </Card.Body>
                                    </Card.Root>
                                ))}
                                </Flex>

                        </Tabs.Content>
                    </Tabs.Root>
                </Card.Body>
            </Card.Root>
        </SidebarWithHeader>
    );
}