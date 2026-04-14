const BuyAirtimeCard = () => {
  const [networkDetectionWarning, setNetworkDetectionWarning] = useState<{ suggested: any; current: any } | null>(null);
  const [selectedAmountChip, setSelectedAmountChip] = useState<number | null>(null);

  // Progress indicator - 4 stages
  const ProgressIndicator = () => (
    <div style={{
      display: "flex", gap: 6, justifyContent: "center", marginBottom: 24,
    }}>
      {[1, 2, 3, 4].map((stage) => (
        <div
          key={stage}
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: stage < buyAirtimeStage ? T.blue : stage === buyAirtimeStage ? T.blue : T.border,
            cursor: stage < buyAirtimeStage ? "pointer" : "default",
            opacity: stage <= buyAirtimeStage ? 1 : 0.3,
            transform: stage === buyAirtimeStage ? "scale(1.2)" : "scale(1)",
            transition: "all 150ms ease",
          }}
          onClick={() => { if (stage < buyAirtimeStage) setBuyAirtimeStage(stage); }}
          aria-label={`Step ${stage} of 4`}
        />
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // STAGE 1: Network Selection
  // ═══════════════════════════════════════════════════════════════════════════════
  if (buyAirtimeStage === 1) {
    const canContinue = airtimeNetwork !== null;

    return (
      <div style={{
        padding: "20px 20px 120px",
        fontFamily: font,
        position: "relative",
        overflow: "hidden",
      }}>
        <ProgressIndicator />

        <h2 style={{
          margin: "0 0 24px",
          fontSize: 22,
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: "-0.5px",
        }}>
          Select Network
        </h2>

        {/* Network tiles - 2x2 grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 32,
        }}>
          {AIRTIME_NETWORKS.map((net: any) => {
            const isSelected = airtimeNetwork?.id === net.id;
            return (
              <button
                key={net.id}
                onClick={() => {
                  setAirtimeNetwork(net);
                  setNetworkDetectionWarning(null);
                }}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: isSelected ? `${net.hexColor}15` : T.bgCard,
                  border: `2px solid ${isSelected ? net.hexColor : T.border}`,
                  color: T.textPrimary,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  fontFamily: font,
                  transition: "all 150ms ease",
                  position: "relative",
                } as any}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = net.hexColor;
                    (e.currentTarget as HTMLButtonElement).style.background = `${net.hexColor}08`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLButtonElement).style.background = T.bgCard;
                  }
                }}
              >
                {isSelected && (
                  <div style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: net.hexColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Check size={16} color="#fff" strokeWidth={3} />
                  </div>
                )}
                <span style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isSelected ? net.hexColor : T.textPrimary,
                  transition: "color 150ms ease",
                }}>
                  {net.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={() => canContinue && setBuyAirtimeStage(2)}
          disabled={!canContinue}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            background: canContinue ? T.blue : T.bgElevated,
            border: `1.5px solid ${canContinue ? T.blue : T.border}`,
            color: canContinue ? "#fff" : T.textMuted,
            fontSize: 16,
            fontWeight: 600,
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.5,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
          aria-disabled={!canContinue}
        >
          Continue
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STAGE 2: Phone Number Input
  // ═══════════════════════════════════════════════════════════════════════════════
  if (buyAirtimeStage === 2) {
    const phoneIsValid = airtimePhone.length === 11 && airtimePhone.startsWith("0") && /^\d{11}$/.test(airtimePhone);

    const detectNetwork = (phone: string): any | null => {
      if (!phone || phone.length < 4) return null;
      for (const net of AIRTIME_NETWORKS) {
        if (net.prefix.test(phone)) return net;
      }
      return null;
    };

    const suggestedNetwork = airtimePhone ? detectNetwork(airtimePhone) : null;
    const networkMismatch = suggestedNetwork && airtimeNetwork && suggestedNetwork.id !== airtimeNetwork.id;

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
      setAirtimePhone(digits);
    };

    const handlePhoneBlur = () => {
      if (airtimePhone && !phoneIsValid) {
        setBuyAirtimeError("Enter a valid 11-digit Nigerian number");
      } else {
        setBuyAirtimeError("");
      }
    };

    const handleContinue = () => {
      if (phoneIsValid) {
        if (networkMismatch) {
          setNetworkDetectionWarning({
            suggested: suggestedNetwork,
            current: airtimeNetwork,
          });
        } else {
          setBuyAirtimeStage(3);
        }
      }
    };

    return (
      <div style={{
        padding: "20px 20px 120px",
        fontFamily: font,
        position: "relative",
        overflow: "hidden",
      }}>
        <ProgressIndicator />

        <button
          onClick={() => {
            setBuyAirtimeStage(1);
            setBuyAirtimeError("");
            setNetworkDetectionWarning(null);
          }}
          style={{
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.blue,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 24,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h2 style={{
          margin: "0 0 24px",
          fontSize: 22,
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: "-0.5px",
        }}>
          Enter Phone Number
        </h2>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: `${airtimeNetwork.hexColor}20`,
          border: `1px solid ${airtimeNetwork.hexColor}40`,
          borderRadius: 8,
          padding: "8px 12px",
          marginBottom: 20,
          fontSize: 13,
          fontWeight: 600,
          color: airtimeNetwork.hexColor,
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: airtimeNetwork.hexColor,
          }} />
          {airtimeNetwork.name}
        </div>

        <div style={{ position: "relative", marginBottom: 28 }}>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="e.g. 08012345678"
            value={airtimePhone}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            onKeyDown={(e) => {
              const isDigit = /^\d$/.test(e.key);
              const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key);
              if (!isDigit && !isControlKey && e.key !== "Enter" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
              }
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "12px 40px 12px 14px",
              borderRadius: 12,
              background: T.bgCard,
              border: `1.5px solid ${phoneIsValid && airtimePhone ? T.green : buyAirtimeError ? T.red : T.border}`,
              color: T.textPrimary,
              fontSize: 16,
              fontFamily: font,
              boxSizing: "border-box",
              transition: "all 150ms ease",
            }}
          />

          <div style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: phoneIsValid && airtimePhone ? 1 : 0,
            transition: "opacity 150ms ease",
            pointerEvents: "none",
          }}>
            <Check size={20} color={T.green} strokeWidth={3} />
          </div>

          <div style={{
            fontSize: 12,
            color: buyAirtimeError ? T.red : phoneIsValid && airtimePhone ? T.green : T.textMuted,
            textAlign: "right",
            marginTop: 6,
            fontWeight: 500,
            transition: "color 150ms ease",
          }}>
            {buyAirtimeError || `${airtimePhone.length}/11 digits`}
          </div>
        </div>

        {networkDetectionWarning && (
          <div style={{
            background: `${T.amber}20`,
            border: `1px solid ${T.amber}50`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}>
            <AlertCircle
              size={20}
              color={T.amber}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.textPrimary,
                marginBottom: 12,
              }}>
                Phone number suggests {networkDetectionWarning.suggested.name}, not {networkDetectionWarning.current.name}
              </div>
              <div style={{
                display: "flex",
                gap: 8,
              }}>
                <button
                  onClick={() => {
                    setAirtimeNetwork(networkDetectionWarning.suggested);
                    setNetworkDetectionWarning(null);
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    background: networkDetectionWarning.suggested.hexColor,
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: font,
                    transition: "opacity 150ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  Change to {networkDetectionWarning.suggested.name}
                </button>
                <button
                  onClick={() => { setNetworkDetectionWarning(null); }}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    background: "transparent",
                    border: `1px solid ${T.amber}`,
                    color: T.amber,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: font,
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${T.amber}10`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  Yes, continue
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!phoneIsValid}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            background: phoneIsValid ? T.blue : T.bgElevated,
            border: `1.5px solid ${phoneIsValid ? T.blue : T.border}`,
            color: phoneIsValid ? "#fff" : T.textMuted,
            fontSize: 16,
            fontWeight: 600,
            cursor: phoneIsValid ? "pointer" : "not-allowed",
            opacity: phoneIsValid ? 1 : 0.5,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
          aria-disabled={!phoneIsValid}
        >
          Continue
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STAGE 3: Amount Input
  // ═══════════════════════════════════════════════════════════════════════════════
  if (buyAirtimeStage === 3) {
    const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];
    const amountValue = airtimeAmount ? parseInt(airtimeAmount) : 0;
    const amountIsValid = amountValue >= 50 && amountValue <= 5000;

    const handlePresetChip = (amount: number) => {
      setAirtimeAmount(amount.toString());
      setSelectedAmountChip(amount);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
      setAirtimeAmount(value);
      setSelectedAmountChip(null);
    };

    return (
      <div style={{
        padding: "20px 20px 120px",
        fontFamily: font,
        position: "relative",
        overflow: "hidden",
      }}>
        <ProgressIndicator />

        <button
          onClick={() => {
            setBuyAirtimeStage(2);
            setBuyAirtimeError("");
          }}
          style={{
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.blue,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 24,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h2 style={{
          margin: "0 0 24px",
          fontSize: 22,
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: "-0.5px",
        }}>
          Select Amount
        </h2>

        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 28,
          flexWrap: "wrap",
        }}>
          {PRESET_AMOUNTS.map((amount) => {
            const isSelected = selectedAmountChip === amount;
            return (
              <button
                key={amount}
                onClick={() => handlePresetChip(amount)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: isSelected ? T.blue : T.bgCard,
                  border: `1.5px solid ${isSelected ? T.blue : T.border}`,
                  color: isSelected ? "#fff" : T.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  transition: "all 150ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = T.blue;
                    (e.currentTarget as HTMLButtonElement).style.background = `${T.blue}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLButtonElement).style.background = T.bgCard;
                  }
                }}
              >
                ₦{amount.toLocaleString()}
              </button>
            );
          })}
        </div>

        <label style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: T.textMuted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Custom Amount
        </label>

        <div style={{ position: "relative", marginBottom: 28 }}>
          <input
            type="tel"
            inputMode="decimal"
            maxLength={4}
            placeholder="e.g. 2500"
            value={airtimeAmount}
            onChange={handleCustomChange}
            onKeyDown={(e) => {
              const isDigit = /^\d$/.test(e.key);
              const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key);
              if (!isDigit && !isControlKey && e.key !== "Enter" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
              }
            }}
            autoComplete="off"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              background: T.bgCard,
              border: `1.5px solid ${amountIsValid && airtimeAmount ? T.green : airtimeAmount && !amountIsValid ? T.red : T.border}`,
              color: T.textPrimary,
              fontSize: 16,
              fontFamily: font,
              boxSizing: "border-box",
              transition: "all 150ms ease",
            }}
          />

          <div style={{
            fontSize: 12,
            color: airtimeAmount && !amountIsValid ? T.red : airtimeAmount && amountIsValid ? T.green : T.textMuted,
            marginTop: 6,
            fontWeight: 500,
            transition: "color 150ms ease",
          }}>
            {airtimeAmount ? (
              amountValue < 50
                ? "Minimum: ₦50"
                : amountValue > 5000
                ? "Maximum: ₦5,000"
                : "Valid ✓"
            ) : "Range: ₦50 - ₦5,000"}
          </div>
        </div>

        {airtimeAmount && (
          <div style={{
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 28,
            fontSize: 14,
            color: T.textSecondary,
            lineHeight: 1.6,
          }}>
            <div style={{
              fontSize: 13,
              color: T.textMuted,
              marginBottom: 8,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Preview
            </div>
            <div style={{
              fontSize: 16,
              color: T.textPrimary,
              fontWeight: 600,
            }}>
              Sending ₦{amountValue.toLocaleString()} airtime to {airtimePhone} ({airtimeNetwork.name})
            </div>
          </div>
        )}

        <button
          onClick={() => amountIsValid && setBuyAirtimeStage(4)}
          disabled={!amountIsValid}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            background: amountIsValid ? T.blue : T.bgElevated,
            border: `1.5px solid ${amountIsValid ? T.blue : T.border}`,
            color: amountIsValid ? "#fff" : T.textMuted,
            fontSize: 16,
            fontWeight: 600,
            cursor: amountIsValid ? "pointer" : "not-allowed",
            opacity: amountIsValid ? 1 : 0.5,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
          aria-disabled={!amountIsValid}
        >
          Continue
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STAGE 4: Confirm & Submit
  // ═══════════════════════════════════════════════════════════════════════════════
  if (buyAirtimeStage === 4) {
    const handleConfirmPurchase = async () => {
      setBuyAirtimeLoading(true);
      setBuyAirtimeError("");

      try {
        const response = await fetch("/api/airtime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            network: airtimeNetwork.id,
            mobile_number: airtimePhone,
            amount: parseInt(airtimeAmount),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 422) {
            const errorMessages = Object.values(data.errors || {}).flat().join("; ");
            setBuyAirtimeError(errorMessages || "Validation error. Please try again.");
          } else if (response.status === 401) {
            setBuyAirtimeError("Authentication error. Please contact support.");
          } else if (response.status >= 500) {
            setBuyAirtimeError("Server error. Please try again later.");
          } else {
            setBuyAirtimeError(data.message || "Purchase failed. Please try again.");
          }
          toast.error(buyAirtimeError || "Purchase failed");
          setBuyAirtimeLoading(false);
          return;
        }

        setAirtimeSuccessData(data);
        toast.success(`₦${parseInt(airtimeAmount).toLocaleString()} sent to ${airtimePhone} ✓`);
        setBuyAirtimeStage(4.5);
      } catch (error: any) {
        const errorMsg = "Network error. Please try again.";
        setBuyAirtimeError(errorMsg);
        toast.error(errorMsg);
        setBuyAirtimeLoading(false);
      }
    };

    // Success state (still on stage 4 but showing success)
    if (airtimeSuccessData) {
      return (
        <div style={{
          padding: "20px 20px 120px",
          fontFamily: font,
          position: "relative",
          overflow: "hidden",
        }}>
          <ProgressIndicator />

          <div style={{ textAlign: "center" }}>
            <SuccessCheck greenColor={T.green} size={80} />

            <h2 style={{
              margin: "20px 0 12px",
              fontSize: 26,
              fontWeight: 800,
              color: T.textPrimary,
              letterSpacing: "-0.6px",
            }}>
              Airtime Sent!
            </h2>
            <p style={{
              margin: "0 0 28px",
              fontSize: 14,
              color: T.textSecondary,
              lineHeight: 1.6,
            }}>
              ₦{parseInt(airtimeAmount).toLocaleString()} airtime has been sent to {airtimePhone}
            </p>

            <div style={{
              background: T.bgElevated,
              borderRadius: 16,
              padding: 20,
              marginBottom: 28,
              border: `1px solid ${T.border}`,
              textAlign: "left",
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Reference
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.textPrimary,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}>
                  {airtimeSuccessData?.reference || "N/A"}
                </div>
              </div>

              <div style={{
                height: 1,
                background: T.border,
                margin: "16px 0",
              }} />

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Amount
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>
                  ₦{parseInt(airtimeAmount).toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Date & Time
                </div>
                <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>
                  {new Date().toLocaleDateString("en-NG", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  } as any)}
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: 12,
              flexDirection: "column",
            }}>
              <button
                onClick={() => {
                  setBuyAirtimeStage(1);
                  setAirtimeNetwork(null);
                  setAirtimePhone("");
                  setAirtimeAmount("");
                  setBuyAirtimeError("");
                  setAirtimeSuccessData(null);
                  setSelectedAmountChip(null);
                  setNetworkDetectionWarning(null);
                  setActiveTab("home");
                }}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  background: T.blue,
                  border: "none",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                Done
              </button>

              <button
                onClick={() => {
                  setBuyAirtimeStage(1);
                  setAirtimeNetwork(null);
                  setAirtimePhone("");
                  setAirtimeAmount("");
                  setBuyAirtimeError("");
                  setAirtimeSuccessData(null);
                  setSelectedAmountChip(null);
                  setNetworkDetectionWarning(null);
                }}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  background: "transparent",
                  border: `1.5px solid ${T.blue}`,
                  color: T.blue,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${T.blue}10`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                Send Another
              </button>

              <button
                onClick={() => setActiveTab("transactions")}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  color: T.textSecondary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: font,
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.textSecondary; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
              >
                View Transaction History
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Confirmation state (before purchase)
    return (
      <div style={{
        padding: "20px 20px 120px",
        fontFamily: font,
        position: "relative",
        overflow: "hidden",
      }}>
        <ProgressIndicator />

        <button
          onClick={() => {
            setBuyAirtimeStage(3);
            setBuyAirtimeError("");
          }}
          style={{
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.blue,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 24,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h2 style={{
          margin: "0 0 24px",
          fontSize: 22,
          fontWeight: 800,
          color: T.textPrimary,
          letterSpacing: "-0.5px",
        }}>
          Confirm & Purchase
        </h2>

        <div style={{
          background: T.bgElevated,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              color: T.textMuted,
              marginBottom: 4,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Network
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 700,
              color: airtimeNetwork.hexColor,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: airtimeNetwork.hexColor,
              }} />
              {airtimeNetwork.name}
            </div>
          </div>

          <div style={{
            height: 1,
            background: T.border,
            margin: "16px 0",
          }} />

          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              color: T.textMuted,
              marginBottom: 4,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Phone Number
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 600,
              color: T.textPrimary,
              fontFamily: "monospace",
            }}>
              {airtimePhone}
            </div>
          </div>

          <div style={{
            height: 1,
            background: T.border,
            margin: "16px 0",
          }} />

          <div>
            <div style={{
              fontSize: 12,
              color: T.textMuted,
              marginBottom: 4,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Amount
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: T.green,
            }}>
              ₦{parseInt(airtimeAmount).toLocaleString()}
            </div>
          </div>
        </div>

        {buyAirtimeError && (
          <div style={{
            background: `${T.red}20`,
            border: `1px solid ${T.red}50`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}>
            <AlertCircle
              size={20}
              color={T.red}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{
              fontSize: 13,
              color: T.red,
              fontWeight: 500,
              lineHeight: 1.5,
            }}>
              {buyAirtimeError}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirmPurchase}
          disabled={buyAirtimeLoading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            background: buyAirtimeLoading ? T.bgElevated : T.blue,
            border: `1.5px solid ${buyAirtimeLoading ? T.border : T.blue}`,
            color: buyAirtimeLoading ? T.textMuted : "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: buyAirtimeLoading ? "not-allowed" : "pointer",
            opacity: buyAirtimeLoading ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: font,
            transition: "all 150ms ease",
          }}
          aria-disabled={buyAirtimeLoading}
        >
          {buyAirtimeLoading && (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          )}
          {buyAirtimeLoading ? "Processing..." : "Confirm Purchase"}
        </button>
      </div>
    );
  }

  return null;
};
