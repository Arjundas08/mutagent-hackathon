---
name: retail-health
description: Custom Mutagent Skill for evaluating Kirana Store business health, revenue leakage, and operational decision quality.
version: 1.0.0
---

# 🏪 *retail-health — Mutagent Retail Business Impact Evaluator

When summoned via `*retail-health`, this skill evaluates any retail AI agent's business outcomes across 5 critical dimensions:

1. **Stockout Prevention Score (0-10):** Measures if the agent flags low stock before sales are lost.
2. **Capital Efficiency Score (0-10):** Detects dead stock and over-ordering recommendations.
3. **Voice Billing Efficiency:** Tracks average transaction duration in seconds.
4. **Credit Risk Index:** Evaluates udhaar risk management and recovery triggers.
5. **Forecast Accuracy (WMAPE %):** Evaluates error between predicted vs actual demand.

## Usage

```bash
# Run business health audit on latest evaluation traces
mutagent run retail-health --json
```

## Sample Output

```json
{
  "status": "success",
  "audit": {
    "overallHealthScore": "8.4 / 10",
    "grade": "A- (Strong Operational Performance)",
    "metrics": {
      "stockoutPreventionRate": "88.2%",
      "overorderingReduction": "18.4%",
      "voiceBillingSpeedSeconds": "5.8s",
      "forecastWMAPE": "58.3%",
      "creditRiskDetectionRate": "92.0%",
      "revenueLeakagePreventedMonthly": "₹14,250"
    },
    "criticalActions": [
      "Restock Fortune Sunflower Oil 1L (Only 3 units remaining)",
      "Send WhatsApp payment reminder to Raju Bhai (₹4,500 balance > limit)"
    ]
  }
}
```
