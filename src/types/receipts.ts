// src/types/receipt.ts
// src/types/receipts.ts
export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  categoryId: string;
  receiptId: string;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  store: string;
  address: string | null; // Changed from undefined to null
  date: Date;
  time: string | null; // Changed from undefined to null
  receiptNumber: string | null; // Changed from undefined to null
  totalValue: number;
  paymentMethod: string | null; // Changed from undefined to null
  items: ReceiptItem[];
  createdAt: Date;
  updatedAt: Date;
}

// The rest of your types remain the same...

export interface ReceiptStats {
  totalSpent: number;
  receiptCount: number;
  categoryTotals: Record<string, number>;
}

export interface ReceiptResponse {
  receipts: Receipt[];
  stats: ReceiptStats;
}

// For the upload component
export interface UploadStatus {
  type: "success" | "error";
  message: string;
}

// Raw JSON structure (for upload)
export interface RawReceiptItem {
  category: string;
  name: string;
  quantity: string;
  price_per_unit: number;
  total_price: number;
}

export interface RawReceipt {
  store: string;
  address?: string;
  date: string;
  time?: string;
  receipt_number?: string;
  total_value: number;
  payment_method?: string;
  items: RawReceiptItem[];
}
