# REGIX Auth Authentication System - Implementation Plan

## Project Structure Overview
The target project (keyauth-shadcn) is a fresh Next.js 16 installation requiring full feature implementation with shadcn/ui components. The reference implementation exists in KeyAuth-React-Example-main with custom styling that needs conversion to shadcn patterns.

---

## Questions for Clarification

1. Do you have a specific design system preference beyond shadcn (colors, spacing scale)?
2. What authentication method should be primary - license key only or username/password?
3. Should the HWID be auto-detected or manually entered? (Auto-detection requires native integration)
4. Is there an existing backend API endpoint for credential updates?
5. Should Discord linking use OAuth or just accept raw Discord IDs?
6. Do you need admin features or just user-facing dashboard?

---

## Implementation Phases

### Phase 1: Core Dashboard
- Dashboard layout with shadcn components
- Header navigation with profile banner
- Session controls and theme toggle

### Phase 2: License Features
- License display with copy functionality
- Expiry status badge with countdown
- Key redemption modal

### Phase 3: Credentials
- HWID/IP/Discord display cards
- Individual update forms
- Auto-detect IP functionality

### Phase 4: API Section
- REST endpoint display
- System status indicator
- Copy functionality

### Phase 5: Polish
- Responsive testing
- Accessibility audit
- Error handling


## 1. User Dashboard & Header Navigation

### 1.1 User Profile & Status Banner
- User Information Display: Avatar component showing current user with fallback initials
- Role-Based Badges: Premium, Provider, Standard user roles with color coding
- Account Metrics: Cards showing subscription status, expiry date, license type
- Theme Toggle: Switch component for dark/light mode (persistent preference)

### 1.2 Session Controls
- Secure Logout: Button with confirmation dialog clearing all session data
- Browser Data Clearing: Utility to clear localStorage and sessionStorage
- Product Navigation: Dropdown to switch between applications

### 1.3 Product Branding Header
- Application Name: Dynamic display from KeyAuth API response
- Versioning: Shows v3.1 or current version tag
- Provider Status: Online/Offline indicator badge
- Navigation: Breadcrumb showing current location

---

## 2. License & Subscription Overview

### 2.1 Active License Details
- Product/Tier Name: REGIX Studio, VENUS, Elite FOV displayed with badge
- License Key Display: Full key shown with copy-to-clipboard button
- License Duration: Shows Lifetime, 30 Days, 7 Days, 1 Day, or Expired
- Key Status Badge: Visual indicator for Access Granted, Suspended, Pending

---

## 3. Hardware & Credential Binding

### 3.1 System Information Display
- Machine SID/HWID: Primary hardware identifier from KeyAuth user data
- IP Address: Current IP registered for API authorization
- Discord ID: Linked Discord user ID for community access

### 3.2 Credential Relinking
- New SID Input: Manual hardware identifier update on system changes
- New IP Input & Auto-Detection: Manual entry plus button for automatic detection
- Discord ID Update: Field to relink Discord account
- Individual Update Buttons: Separate triggers for each credential field

---

## 4. Verification API Engine

### 4.1 REST API Endpoint
- Client Verification URL: GET /api/verify?sid={MACHINE_SID}&key={LICENSE_KEY}
- Live Status Indicator: Real-time Online/Offline badge
- Copy Endpoint: One-click button to copy full API string

---

## 5. Key Redemption & Renewal

### 5.1 Redeem Key Form
- Modal interface for license key input
- Key Replacement: Swaps old key with validated new key
- Credential Preservation: Maintains HWID, IP, Discord when upgrading

