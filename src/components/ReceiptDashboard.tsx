"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import _ from "lodash";
import type { ReceiptResponse, Receipt, ReceiptItem } from "@/types/receipts";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface CategoryChartData {
  name: string;
  value: number;
}

interface ItemChartData {
  name: string;
  totalPrice: number;
  category: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const ReceiptDashboard: React.FC = () => {
  const [data, setData] = useState<ReceiptResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        const response = await fetch(`/api/receipts?${queryParams}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = (await response.json()) as ReceiptResponse;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) return <div className='p-4'>Loading...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;
  if (!data) return <div className='p-4'>No data available</div>;

  // Process category data for pie chart
  const categoryData: CategoryChartData[] = Object.entries(
    data.stats.categoryTotals
  ).map(
    ([name, value]): CategoryChartData => ({
      name,
      value: Number(value), // Ensure value is a number
    })
  );

  // Process items data for bar chart (top 10 most expensive items)
  const itemsData: ItemChartData[] = data.receipts.flatMap(
    (receipt: Receipt): ItemChartData[] =>
      receipt.items.map(
        (item: ReceiptItem): ItemChartData => ({
          name: item.name,
          totalPrice: item.totalPrice,
          category: item.category.name,
        })
      )
  );

  const top10Items = _.orderBy(itemsData, ["totalPrice"], ["desc"]).slice(
    0,
    10
  );

  const handleDateChange =
    (type: keyof DateRange) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange((prev) => ({
        ...prev,
        [type]: event.target.value,
      }));
    };

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Spending Dashboard</h1>

        <div className='flex gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Start Date
            </label>
            <input
              type='date'
              value={dateRange.startDate}
              onChange={handleDateChange("startDate")}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              End Date
            </label>
            <input
              type='date'
              value={dateRange.endDate}
              onChange={handleDateChange("endDate")}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardContent className='flex items-center p-6'>
            <div className='rounded-full p-3 bg-blue-100'>
              <DollarSign className='h-6 w-6 text-blue-600' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Total Spent</p>
              <h3 className='text-2xl font-bold'>
                R$ {data.stats.totalSpent.toFixed(2)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='flex items-center p-6'>
            <div className='rounded-full p-3 bg-green-100'>
              <ShoppingBag className='h-6 w-6 text-green-600' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Total Receipts
              </p>
              <h3 className='text-2xl font-bold'>{data.stats.receiptCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='flex items-center p-6'>
            <div className='rounded-full p-3 bg-yellow-100'>
              <Calendar className='h-6 w-6 text-yellow-600' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Latest Purchase
              </p>
              <h3 className='text-lg font-bold'>
                {data.receipts[0]
                  ? new Date(data.receipts[0].date).toLocaleDateString()
                  : "N/A"}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='flex items-center p-6'>
            <div className='rounded-full p-3 bg-purple-100'>
              <TrendingUp className='h-6 w-6 text-purple-600' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>
                Avg per Receipt
              </p>
              <h3 className='text-lg font-bold'>
                R${" "}
                {data.stats.receiptCount > 0
                  ? (data.stats.totalSpent / data.stats.receiptCount).toFixed(2)
                  : "0.00"}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Expensive Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={top10Items}
                  layout='vertical'
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis type='number' />
                  <YAxis
                    dataKey='name'
                    type='category'
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Bar dataKey='totalPrice' fill='#8884d8' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='p-4 text-left font-medium'>Date</th>
                  <th className='p-4 text-left font-medium'>Store</th>
                  <th className='p-4 text-left font-medium'>Items</th>
                  <th className='p-4 text-left font-medium'>Total</th>
                  <th className='p-4 text-left font-medium'>Payment</th>
                </tr>
              </thead>
              <tbody>
                {data.receipts.map((receipt) => (
                  <tr key={receipt.id} className='border-t hover:bg-gray-50'>
                    <td className='p-4'>
                      {new Date(receipt.date).toLocaleDateString()}
                    </td>
                    <td className='p-4'>{receipt.store}</td>
                    <td className='p-4'>{receipt.items.length} items</td>
                    <td className='p-4'>R$ {receipt.totalValue.toFixed(2)}</td>
                    <td className='p-4'>{receipt.paymentMethod || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptDashboard;
