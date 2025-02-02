import ReceiptUpload from "@/components/ReceiptUpload";

export default function UploadPage() {
  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6'>Upload Receipt</h1>
      <ReceiptUpload />
    </div>
  );
}
