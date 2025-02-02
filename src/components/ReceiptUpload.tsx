"use client";
// src/components/ReceiptUpload.tsx
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import type { UploadStatus, RawReceipt, Receipt } from "@/types/receipts";

const ReceiptUpload: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  interface UploadResult {
    success: boolean;
    data?: Receipt;
    error?: string;
    details?: unknown;
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      let json: RawReceipt;

      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid JSON file format");
      }

      // Add validation for required fields
      if (!json.store || !json.total_value || !json.items) {
        throw new Error(
          "Missing required fields: store, total_value, or items"
        );
      }

      // Make the API request
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
      });

      const result = (await response.json()) as UploadResult;

      console.log(response);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadStatus({
        type: "success",
        message: `Receipt uploaded successfully! Total: R$ ${result.data?.totalValue.toFixed(
          2
        )}`,
      });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      setUploadStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Error uploading receipt",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div className='p-6 max-w-2xl mx-auto'>
      <Card>
        <CardHeader>
          <CardTitle>Upload Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
              ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-blue-500 hover:bg-blue-50"
              }
              transition-colors`}
          >
            <input {...getInputProps()} />
            <Upload className='w-12 h-12 mx-auto mb-4 text-gray-400' />
            {isLoading ? (
              <p className='text-gray-500'>Uploading...</p>
            ) : isDragActive ? (
              <p className='text-blue-500'>Drop the receipt JSON file here</p>
            ) : (
              <div className='space-y-2'>
                <p className='text-gray-500'>
                  Drag and drop a receipt JSON file here, or click to select
                </p>
                <p className='text-sm text-gray-400'>
                  File must be a valid JSON with store, total_value, and items
                  fields
                </p>
              </div>
            )}
          </div>

          {uploadStatus && (
            <Alert
              className={`mt-4 ${
                uploadStatus.type === "success" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              {uploadStatus.type === "success" ? (
                <CheckCircle className='h-4 w-4 text-green-500' />
              ) : (
                <XCircle className='h-4 w-4 text-red-500' />
              )}
              <AlertDescription>{uploadStatus.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptUpload;
