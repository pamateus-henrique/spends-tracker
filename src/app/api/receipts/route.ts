// src/app/api/receipts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RawReceipt, Receipt } from "@/types/receipts";

interface ApiResponse {
  success: boolean;
  data?: Receipt | Receipt[]; // Allow single Receipt or array of Receipts
  receipts?: Receipt[]; // For GET requests
  stats?: {
    totalSpent: number;
    receiptCount: number;
    categoryTotals: Record<string, number>;
  };
  error?: string;
  details?: unknown;
}

// src/app/api/receipts/route.ts
export async function POST(request: Request) {
  try {
    const json = (await request.json()) as RawReceipt;
    console.log("Received JSON:", json);

    // Add validation logging
    if (!json.store || !json.total_value || !json.items) {
      console.log("Validation failed:", {
        store: json.store,
        total_value: json.total_value,
        items: json.items,
      });
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
      } as ApiResponse);
    }

    // Add date parsing logging
    console.log("Date string received:", json.date);

    // Convert date string to Date object
    const dateparts = json.date.split("/");
    const date = new Date(
      parseInt(dateparts[2]),
      parseInt(dateparts[1]) - 1,
      parseInt(dateparts[0])
    );

    const receipt = await prisma.$transaction(
      async (
        tx: Omit<
          typeof prisma,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
        >
      ) => {
        const categoryPromises = json.items.map(async (item) => {
          return await tx.category.upsert({
            where: { name: item.category },
            create: { name: item.category },
            update: {},
          });
        });

        const categories = await Promise.all(categoryPromises);

        return await tx.receipt.create({
          data: {
            store: json.store,
            address: json.address ?? null,
            date: date,
            time: json.time ?? null,
            receiptNumber: json.receipt_number ?? null,
            totalValue: json.total_value,
            paymentMethod: json.payment_method ?? null,
            items: {
              create: json.items.map((item, index) => {
                const qtyMatch = item.quantity.match(/^([\d.]+)\s*([A-Za-z]+)/);
                const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
                const unit = qtyMatch ? qtyMatch[2] : "UN";

                return {
                  name: item.name,
                  quantity: qty,
                  unit: unit,
                  pricePerUnit: item.price_per_unit,
                  totalPrice: item.total_price,
                  category: {
                    connect: {
                      id: categories[index].id,
                    },
                  },
                };
              }),
            },
          },
          include: {
            items: {
              include: {
                category: true,
              },
            },
          },
        });
      },
      {
        timeout: 10000, // Increase timeout to 10 seconds
      }
    );

    return NextResponse.json({
      success: true,
      data: receipt,
    } as ApiResponse);
  } catch (error: unknown) {
    console.error("Detailed error:", {
      name: error instanceof Error ? error.name : "Unknown error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: "Missing date range parameters",
      });
    }

    const receipts = await prisma.receipt.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const stats = {
      totalSpent: receipts.reduce(
        (sum, receipt) => sum + receipt.totalValue,
        0
      ),
      receiptCount: receipts.length,
      categoryTotals: receipts.reduce((acc, receipt) => {
        receipt.items.forEach((item) => {
          const category = item.category.name;
          acc[category] = (acc[category] || 0) + item.totalPrice;
        });
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      success: true,
      receipts,
      stats,
    });
  } catch (error: unknown) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
