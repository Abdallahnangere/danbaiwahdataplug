"use client";

interface TransactionReceiptProps {
  beneficiaryNumber: string;
  planBought: string;
  price: number;
  status: string;
  reference: string;
}

export default function TransactionReceipt(props: TransactionReceiptProps) {
  const { beneficiaryNumber, planBought, price, status, reference } = props;
  const success = String(status || "").toUpperCase() === "SUCCESS";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #BBF7D0",
        borderRadius: 16,
        padding: 14,
        color: "#052E16",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.jpeg" alt="Danbaiwah Data Plug" style={{ width: 26, height: 26, borderRadius: 6, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#166534" }}>Danbaiwah Data Plug</div>
            <div style={{ fontSize: 10, color: "#15803D" }}>www.danbaiwahdataplug.com</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 999, background: success ? "#DCFCE7" : "#FEE2E2", color: success ? "#166534" : "#991B1B" }}>
          {success ? "SUCCESS" : status}
        </span>
      </div>

      <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
        <div><strong>Beneficiary:</strong> {beneficiaryNumber}</div>
        <div><strong>Plan Bought:</strong> {planBought}</div>
        <div><strong>Price:</strong> ₦{Number(price || 0).toLocaleString()}</div>
        <div><strong>Reference:</strong> <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{reference}</span></div>
      </div>
    </div>
  );
}
