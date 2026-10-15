# Max Gain / Home Loan Advantage Smart Calculator

[![React 19](https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-4.3-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Capacitor Native](https://img.shields.io/badge/Capacitor-8.5-119eff?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

An advanced, responsive, mobile-first financial simulation platform modeling overdraft-linked home loans (e.g., **SBI MaxGain**, **ICICI Home Loan Advantage**, **Bank of Baroda Home Loan Advantage**). It supports 30-year amortizations (up to 360 months), multi-tier interest rate lock-in phase ledgers, dual tenure vs. EMI optimization strategies, and interactive surplus what-if ledgers.

---

## 📲 Live Deployments & Mobile Downloads

| Platform | Channel | Link |
| :--- | :--- | :--- |
| **🌐 iOS / Safari / Desktop** | Instant Web App (PWA) | [Launch Live Web App](https://max-gain-smart-calculator.onrender.com) |
| **🤖 Android Native (Expo EAS)** | EAS Cloud Build APK | [Download Expo APK](https://expo.dev/artifacts/eas/r6488KMd_Qapm6Pv9k3jVEfCj6TqUa0agO_q1QKNvY4.apk) |
| **🤖 Android Native (GitHub)** | Standalone APK (v1.0.0) | [Download APK (4.16 MB)](https://github.com/adk113/max-gain-smart-calculator/releases/download/v1.0.0/app-debug.apk) |
| **📱 Mobile QR Share Hub** | Scannable QR Codes | [Open Share Hub (`/share`)](https://max-gain-smart-calculator.onrender.com/share) |
| **⚡ Expo Dashboard** | EAS Project Builds | [View on Expo.dev](https://expo.dev/accounts/adk113/projects/max-gain-smart-calculator) |

---

## 🚀 Key Features

### 1. Advanced Overdraft Financial Engine
- **Interest Offset Axiom**: Money parked in the overdraft current account directly reduces accrued interest without lock-in:
  $$\text{Accrued Monthly Interest} = \max\left(0, (\text{Current Principal} - \text{Parked Surplus}) \times \frac{\text{Rate}}{12 \times 100}\right)$$
- **Zero Default Prepayments**: All monthly prepayments and withdrawal inputs default strictly to **0**.
- **Excel Parity**: Fully validated against the reference workbook (`Loan Tennure calulation.xlsx`) with 100% mathematical parity.

### 2. Dual Mode Strategy: Fix EMI vs. Fix Tenure
- **Fix EMI Mode (Variable Tenure)**: Benchmark EMI remains constant; parked surplus and prepayments accelerate principal payoff, cutting years off the loan.
- **Fix Tenure Mode (Variable EMI)**: Total tenure remains locked; surplus reduces required monthly active EMI payments, delivering immediate cashflow relief.

### 3. Smart Salary Float & Parking Cycle Simulator
- **Zero-Extra-Capital Arbitrage**: Models the practical reality of receiving salary on the 1st, parking it in the OD account for $D$ days, and then withdrawing $W\%$ on Day $D+1$ for household expenses, credit card bills, and rent.
- **Daily Reducing Balance Math**: Implements the banking time-weighted daily average balance formula:
  $$\bar{S}_{\text{daily}} = \frac{(S \times D) + \left(S \times (1 - \frac{W}{100}) \times (30 - D)\right)}{30}$$
- **Visual 30-Day Flow Bar**: Color-coded split bar comparing Phase 1 (100% Salary Parked) vs. Phase 2 (Retained Float post-expense withdrawal).
- **Instant Timing Metric**: Computes pure timing interest saved per month without needing any outside capital.

### 3. Multi-Tier Interest Rate Lock-In Ledger
- Chain multiple fixed-rate periods (e.g., **Phase 1**: 3 Years @ 9.50%, **Phase 2**: 2 Years @ 8.75%).
- Remaining timeline up to Year 30 (Month 360) seamlessly falls back to a customizable Year-on-Year (YoY) variable benchmark rate ledger.

### 4. Smart Financial Milestones & Insights
- Dynamic timeline callouts identifying:
  - **Tenure Reductions**: e.g., *"Loan tenure reduced by 2 Years 10 Months (Payoff advanced from Aug 2044 to Sep 2041)"*.
  - **EMI / Rate Shifts**: e.g., *"Effective from Month 37 (Aug 2027), interest rate adjusted to 8.75% with revised monthly installment"*.
  - **Closure Events**: Exact debt freedom month and final payout amount.

### 5. Multi-Currency with Default INR (₹)
- Default currency: **INR (₹)** with dual Indian numbering format (Lakhs `L` / Crores `Cr`, e.g., `₹52,00,000`, `₹1.50 Cr`).
- Instant switching to USD (`$`), EUR (`€`), GBP (`£`), AED (`AED`), CAD (`C$`), AUD (`A$`), and SGD (`S$`).

### 6. Interactive 360-Month What-If Ledger
- Paginated table (12, 24, 60, or 360 months per page) with quick jump buttons (*Year 1*, *Year 5*, *Year 10*, and *Closure Month*).
- Inline editable surplus input cells per month.
- Distinct gold and emerald celebration banner on the exact loan closure row.

### 7. Cross-Platform & Zero-Backend Shareability
- **1-Click Shareable Link**: Serializes the complete 360-month simulation state into a URL hash fragment for instant execution in iOS Safari or Android Chrome without server dependency.
- **CSV Data Export**: One-click download of the complete 360-month dataset.
- **Native Android APK Ready**: Pre-configured Capacitor infrastructure for instant mobile compilation.

---

## 🛠️ Local Development & Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation
```bash
# Clone the repository
git clone https://github.com/adk113/max-gain-smart-calculator.git
cd max-gain-smart-calculator

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📱 Mobile Compilation & Android APK Guide

This project includes ready-to-run **Capacitor** native configurations (`capacitor.config.json` with App ID `com.adk113.maxgainsmartcalculator`).

### Compiling Android APK
```bash
# 1. Build the production web bundle
npm run build

# 2. Add Android platform (one-time setup)
npx cap add android

# 3. Synchronize web assets to native Android project
npm run cap:sync

# 4. Open in Android Studio to build APK or run on device
npm run cap:open:android

# OR build Debug APK directly via Gradle CLI (if Android SDK is installed):
cd android && ./gradlew assembleDebug
# Generated APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 Progressive Web App (PWA) & iOS Safari Execution

1. Host the `dist/` directory on any static host (GitHub Pages, Cloudflare Pages, Vercel, or Netlify).
2. Open the URL in **iOS Safari**.
3. Tap the **Share** button and select **"Add to Home Screen"**.
4. The app launches full-screen without Safari browser chrome, functioning identically to a native iOS application.

---

## 📊 Sample Excel Scenario Benchmark

To verify exact calculations against the sample workbook (`Loan Tennure calulation.xlsx`):
1. Click **"📊 Load Sample Excel (₹52L)"** in the top banner.
2. Parameters loaded:
   - **Loan Principal**: ₹52,00,000 (52 Lakhs)
   - **Tenure**: 20 Years (240 Months)
   - **Start Date**: Aug 1, 2024
   - **Interest Rate**: 9.50%
   - **Prepayments**: ₹25,000/mo for Months 1 to 12
3. **Simulation Results**:
   - **Loan Closure Month**: **Month 206 (Sep 2041)**
   - **Tenure Saved**: **34 Months (2 Years 10 Months)**
   - **Lifetime Interest Saved**: **₹4,82,150+**
   - **Initial EMI**: **₹48,471/mo**

---

## 📄 License
MIT License. Created for adk113 / AntiGravity ecosystem.
