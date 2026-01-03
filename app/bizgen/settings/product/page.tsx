"use client";

import SidebarWithHeader from "@/components/ui/SidebarWithHeader";
import { Button, ButtonGroup, Flex, Heading, IconButton, Pagination, Table } from "@chakra-ui/react";
import { useState } from "react";
import ProductDialog from "./productDialog";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export default function SettingProduct(){
    const [loading, setLoading] = useState(false);
    // const [auth, setAuth] = useState<DecodedAuthToken | null>(null);
    const [productPage, setProductPage] = useState(1);
    const [productPagination, setProductPagination] = useState({ total_pages: 1, page: 1 });
    const [findProduct, setFindProduct] = useState('');
    // const [productData, setProductData] = useState<Product[]>([]);
    const [showAlert, setShowAlert] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorTitle, setErrorTitle] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isProductOpen, setIsProductOpen] = useState(false);
    // const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    
    return(
        <SidebarWithHeader username={"-"}>
            
            <Flex gap={2} display={"flex"} mb={"2"} mt={"2"}>
                <Heading mb={6} width={"100%"}>Product ERP Settings</Heading>
                <Button>Create New Product</Button>
            </Flex>           

            {/* {showAlert && <AlertMessage title={errorTitle} description={errorMessage} isSuccess={isSuccess} />} */}

            {/* <ProductDialog 
                isOpen={isProductOpen} 
                setIsOpen={(open) => {
                    setIsProductOpen(open);
                    if (!open) setEditingProduct(null);
                }}
                title={editingProduct ? "Update Product" : "Create Product"}
                placeholders={editingProduct ? { product_id: editingProduct.product_id, product_code: editingProduct.product_code, product_name: editingProduct.product_name, product_desc: editingProduct.product_desc } : undefined}
                onSubmit={(data) =>
                    editingProduct ? handleUpdateProduct(data) : handleCreateProduct(data)
                }
            /> */}

            <Table.Root>
                <Table.Header>
                    <Table.Row bg="bg.panel">
                        <Table.ColumnHeader textAlign={"center"}>Code</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Product Name</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Product Description</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign={"center"}>Action</Table.ColumnHeader>
                    </Table.Row>                    
                </Table.Header>

                {/* <Table.Body>
                    {productData.map((product) => (
                    <Table.Row key={product.product_id}>
                        <Table.Cell textAlign={"center"}>{product.product_code}</Table.Cell>
                        <Table.Cell textAlign={"center"}>{product.product_name}</Table.Cell>
                        <Table.Cell textAlign={"center"}>
                        {product.product_desc.length > 60
                            ? product.product_desc.substring(0, 60) + "..."
                            : product.product_desc}
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                            <Flex justify="center" gap={4} fontSize={"2xl"}>
                                <FiEdit
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setEditingProduct(product);
                                        setIsProductOpen(true);
                                    }}
                                />
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <FiTrash />
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>Hapus Produk</Dialog.Title>
                                                </Dialog.Header>

                                                 <Dialog.Body>
                                                    <Text>Apakah anda yakin ingin menghapus produk ini ?</Text>
                                                </Dialog.Body>

                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button variant="outline">Batal</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button onClick={() => handleDeleteProduct({ product_id: product.product_id })}>Hapus Produk</Button>
                                                </Dialog.Footer>
                                                
                                                <Dialog.CloseTrigger asChild>
                                                    <CloseButton size="sm" />
                                                </Dialog.CloseTrigger>

                                            </Dialog.Content>
                                        </Dialog.Positioner>
                                    </Portal>

                                </Dialog.Root>
                            </Flex>
                        </Table.Cell>
                    </Table.Row>
                    ))}
                </Table.Body>                 */}
            </Table.Root> 

            <Flex display={"flex"} justify="flex-end" alignItems={"end"} width={"100%"} mt={"3"}>
                <Pagination.Root
                    count={productPagination.total_pages}pageSize={1} 
                    page={productPage} onPageChange={(details) => setProductPage(details.page)}
                >
                    <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                    <Pagination.PrevTrigger asChild>
                        <IconButton>
                        <LuChevronLeft />
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.Items
                        render={(page) => (
                        <IconButton
                                    key={page.value}
                                    variant={page.value === productPage ? "outline" : "ghost"} onClick={() => setProductPage(page.value)}
                                >
                                    {page.value}
                                </IconButton>
                        )}
                    />

                    <Pagination.NextTrigger asChild>
                        <IconButton>
                        <LuChevronRight />
                        </IconButton>
                    </Pagination.NextTrigger>
                    </ButtonGroup>
                </Pagination.Root>

            </Flex>            

        </SidebarWithHeader>
        // settings

    );
}