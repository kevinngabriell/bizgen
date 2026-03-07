export interface createStockTransaction{
    action: string;
    warehouse_id: string;
    product_id: string;
    date: string;
    reference_no: string;
    notes: string;
    items: createStockItemTransaction[]
}

export interface createStockItemTransaction{
    inventory_stock_id: string;
    lot: string;
    quantity: number;
    expired_date : string;
}

export interface WarehouseSummary {
    total_sku: number;
    total_stock_qty: number;
    pending_movements: number;
}

export interface GetWarehouseData {
    inventory_stock_movements_id: string;
    product_id: string;
    warehouse_id: string;
    lot_no: string;
    qty_before: string;
    qty_change: string;
    qty_after: string;
    inventory_transaction_items_id: string;
    created_by: string;
    created_at: string;
}

export interface ProductLotSearchData {
    inventory_stock_id: string;
    product_id: string;
    product_name: string;
    warehouse_id: string;
    lot_no: string;
    qty: number;
}

export async function createStockIn(input: createStockTransaction) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}warehouse/transaction.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: input.action,
            warehouse_id: input.warehouse_id,
            product_id: input.product_id,
            reference_no: input.reference_no,
            notes: input.notes,
            date: input.date,
            items: input.items
        })
    })

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create create stock in');
    }

    return json;
}

export async function createStockOutSample(input: createStockTransaction) : Promise<any> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}warehouse/transaction.php`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: input.action,
            warehouse_id: input.warehouse_id,
            product_id: input.product_id,
            reference_no: input.reference_no,
            notes: input.notes,
            items: input.items
        })
    })

    const json = await res.json();

    //Jika statusnya bukan 201 atau 200 maka error 
    if (json.status_code !== 201 && json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to create create stock out');
    }

    return json;
}

export async function getWarehouseStockDetail(product_id: string = '', warehouse_id: string = ''): Promise<{data: GetWarehouseData[]}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}warehouse/transaction.php?product_id=${product_id}&warehouse_id=${warehouse_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch warehouse stock');
    }

    return {
        data: json.data?.data || []
    };
}

export async function getWarehouseStockSummary(): Promise<{data: WarehouseSummary}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}warehouse/transaction.php?summary`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch warehouse stock summary');
    }

    return {
        data: json.data || []
    };
}

export async function getSearchProductLot(): Promise<{data: ProductLotSearchData}>{
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    const res = await fetch(`${baseUrl}warehouse/transaction.php?lotproduct`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const json = await res.json();

    if (json.status_code !== 200) {
        throw new Error(json.status_message || 'Failed to fetch warehouse lot product data');
    }

    return {
        data: json.data || []
    };
}