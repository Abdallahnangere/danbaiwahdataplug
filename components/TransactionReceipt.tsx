"use client";

interface TransactionReceiptProps {
  beneficiaryNumber: string;
  planBought: string;
  price: number;
  status: string;
  reference: string;
  networkName?: string;
  createdAt?: string | Date | null;
}

const NAIRA = "\u20A6";
const WEBSITE = "www.danbaiwahdataplug.com";
const SUPPORT_EMAIL = "support@danbaiwahdataplug.com";

const formatReceiptDate = (value?: string | Date | null) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
};

export default function TransactionReceipt(props: TransactionReceiptProps) {
  const {
    beneficiaryNumber,
    planBought,
    price,
    status,
    reference,
    networkName,
    createdAt,
  } = props;
  const normalizedStatus = String(status || "PENDING").toUpperCase();
  const success = normalizedStatus === "SUCCESS";
  const rows = [
    ["NETWORK", networkName || "N/A"],
    ["PLAN BOUGHT", planBought || "N/A"],
    ["RECIPIENT", beneficiaryNumber || "N/A"],
    ["DATE & TIME", formatReceiptDate(createdAt)],
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: 18,
        background: "#F4F7F5",
        boxShadow: "0 24px 70px rgba(0, 0, 0, 0.24)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 250,
          padding: "28px 22px 44px",
          overflow: "hidden",
          background: "linear-gradient(135deg, #064E3B 0%, #16A34A 58%, #34D399 100%)",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -54,
            top: -82,
            width: 210,
            height: 210,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 22,
            top: 40,
            width: 98,
            height: 98,
            borderRadius: "50%",
            background: "rgba(5,150,105,0.18)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                padding: 6,
                background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(255,255,255,0.42)",
                boxShadow: "0 12px 30px rgba(6,78,59,0.25)",
                flexShrink: 0,
              }}
            >
              <img
                src="/logo.jpeg"
                alt="DANBAIWA DATA PLUG"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 11,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                DANBAIWA
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 12,
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "2.4px",
                }}
              >
                TRANSACTION RECEIPT
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 999,
              border: `1.5px solid ${success ? "rgba(74,222,128,0.65)" : "rgba(248,113,113,0.7)"}`,
              padding: "9px 13px",
              background: success ? "rgba(22,163,74,0.28)" : "rgba(185,28,28,0.22)",
              color: success ? "#86EFAC" : "#FCA5A5",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "1.6px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            <span style={{ marginRight: 7 }}>{"\u25CF"}</span>
            {success ? "SUCCESS" : normalizedStatus}
          </div>
        </div>

        <div style={{ position: "relative", textAlign: "center", marginTop: 54 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.56)",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "3px",
            }}
          >
            TOTAL AMOUNT PAID
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 66,
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: "-3px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                verticalAlign: "34px",
                marginRight: 7,
                color: "rgba(255,255,255,0.62)",
                letterSpacing: 0,
              }}
            >
              {NAIRA}
            </span>
            {Number(price || 0).toLocaleString("en-NG", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div
            style={{
              display: "inline-block",
              maxWidth: "100%",
              marginTop: 26,
              padding: "12px 22px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.58)",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "1px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              wordBreak: "break-all",
            }}
          >
            REF: {reference || "N/A"}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -1,
            height: 25,
            background:
              "radial-gradient(circle at 21px 0, #FFFFFF 20px, transparent 21px) repeat-x",
            backgroundSize: "44px 25px",
          }}
        />
      </div>

      <div style={{ background: "#FFFFFF", padding: "18px 22px 0" }}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "grid",
              gridTemplateColumns: "42% 58%",
              gap: 10,
              alignItems: "center",
              minHeight: 72,
              borderBottom: "1px solid #E7EBE8",
            }}
          >
            <div
              style={{
                color: "#9CA3AF",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.8px",
              }}
            >
              {label}
            </div>
            <div
              style={{
                color: "#181827",
                fontSize: 18,
                fontWeight: 900,
                textAlign: "right",
                lineHeight: 1.25,
                wordBreak: "break-word",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#F3F4F6",
          padding: "28px 22px 30px",
          textAlign: "center",
          color: "#A7ABB3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ height: 1, background: "#D1D5DB", flex: 1 }} />
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "1.8px" }}>
            SECURED BY DANBAIWA
          </div>
          <div style={{ height: 1, background: "#D1D5DB", flex: 1 }} />
        </div>
        <div style={{ fontSize: 13, marginBottom: 14 }}>{SUPPORT_EMAIL}</div>
        <div style={{ fontSize: 12 }}>
          {"\u00A9"} DANBAIWA DATA PLUG 2026 {"\u00B7"} {WEBSITE}
        </div>
      </div>
    </div>
  );
}
