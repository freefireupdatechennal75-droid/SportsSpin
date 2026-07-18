# 🏆 Sports Day 2026 – Team Allocation System

Welcome to the **College Sports Day Team Allocation System**, a production-grade full-stack application designed to register students, run server-authoritative randomized allocation spinning wheels, and monitor live metrics through a secure administrative portal.

---

## 🎨 Design & Aesthetic Identity

- **Apple-Inspired Glassmorphism**: Soft glass cards, floating inputs, and responsive layouts styled with Tailwind CSS.
- **Micro-interactions & Animations**: Powered by `motion/react` for elegant page entries and card transitions.
- **Multi-Sensory Wheel Engine**: High-fidelity SVG vector wheel featuring native physical tick-clicking sound effects generated dynamically via the **HTML5 Web Audio API** (zero dependency) and landing celebration canvas-confetti blasts.
- **True Desktop & Mobile Fluidity**: Fluid layouts designed for desktop screens and mobile interfaces.

---

## 🧮 Core Mathematics: Perfectly Balanced Allocations

To prevent any team from becoming overcrowded, the backend dynamically calculates and updates capacity limits for each of the four teams:
- 🔵 **Blue Jaguars**
- 🔴 **Red Dragons**
- 🟢 **Green Vipers**
- 🟡 **Yellow Lions**

### Team Bounds Algorithm
For a total target capacity $N$ entered by the Administrator:
$$\text{Base Team Capacity} = \lfloor N / 4 \rfloor$$
$$\text{Remainder} = N \pmod 4$$

The remainder is distributed in sequence (Blue, Red, Green):
- **Blue Limit** $= \text{Base} + (\text{Remainder} \ge 1 ? 1 : 0)$
- **Red Limit** $= \text{Base} + (\text{Remainder} \ge 2 ? 1 : 0)$
- **Green Limit** $= \text{Base} + (\text{Remainder} \ge 3 ? 1 : 0)$
- **Yellow Limit** $= \text{Base}$

*Example:* If $N = 205$:
- Base Capacity = $51$
- Remainder = $1$
- **Limits**: Blue $= 52$, Red $= 51$, Green $= 51$, Yellow $= 51$.

### Server-Authoritative Spin Logic
1. When a student clicks **SPIN**, a POST request is sent to the Express API `/api/students/spin`.
2. The server compares current allocation counts to individual limits.
3. It filters out any team that is fully loaded, producing an `availableTeams` list.
4. It randomly selects one team **ONLY** from the available list.
5. It records the assignment in the local database `db.json`.
6. The client wheel receives the assigned team, calculates the required deceleration angles, and smoothly spins to land on that exact color!

---

## 🚀 Technical Stack & Architecture

### Frontend
- **Framework**: React 19 + TypeScript (Vite-powered SPA)
- **Styling**: Tailwind CSS v4
- **Animation**: `motion/react` (Motion v12)
- **Visual Charts**: `recharts` (D3-powered React wrapper)
- **Feedback**: Dynamic HTML5 Web Audio Synthesizer, custom Canvas-Confetti

### Backend & Middleware
- **Runtime**: Node.js & Express Server (running on Port 3000)
- **Compiler**: `tsx` (Dev compilation) + `esbuild` (Production bundles into `dist/server.cjs`)
- **Authentication**: JWT (JSON Web Tokens) with 8-hour sessions
- **Encryption**: `bcryptjs` for secure local admin credentials hashing
- **Security**: XSS Protections, X-Content-Type Guard, Frame-Origin Constraints

### Database Persistence
- **Local File-based Database**: Managed inside `db.json` at the project root with transactional file-write caching inside `server_db.ts` to survive container restarts and host sleep scales.

---

## 🗺️ Page Architecture

### 1. Student Registration Form
- Comprehensive fields: Student Name, Register Number (Unique), Department, Year, Contact Phone, and Gender.
- Instant, debounced API validation check to prevent duplicate ID entries.

### 2. Physical Spin Wheel
- Beautiful spinning segments.
- Physical ticking audio clips and celebration canvas confetti.

### 3. Allocation Results Card
- Unique gradient headers corresponding to the assigned team color.
- Action instructions guiding the student on next-step desk checkins.

### 4. Admin Security Login
- Sleek glassmorphic card with credentials validation.
- Seeds default administrative credentials on startup.

### 5. Admin Dashboard Tab
- Modern stat card metrics reflecting current allocation status and limits.
- Interactive **Recharts Pie Chart** mapping team ratios.
- Stream of latest registrants and live security activity logs (audit trails).

### 6. Allocated Team List Tab
- Compact list-view grid.
- Advanced filters: keyword search, filter by team, department major, and academic cohorts.
- Secure, authorized deletions.

### 7. Analytical Reports Tab
- Bar charts comparing current allocations vs team limits.
- Horizontal bar graphs tracking major departments.
- Excel CSV download exports and print formatting templates.

---

## 🔒 Security Auditing Credentials

On startup, the system seeds a default staff administrator:
- **Username**: `admin`
- **Password**: `admin123`

*Password hashes are secured via standard 10-round bcrypt cryptography.*

---

## 🛠️ Local Installation & Development

To launch the system on your local machine:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Boot Full-Stack Server** (Runs both the Express API and the Vite proxy client on port 3000)
   ```bash
   npm run dev
   ```

3. **Build & Bundle** (Produces static SPA bundles in `dist/` and a consolidated `dist/server.cjs` backend server)
   ```bash
   npm run build
   ```

4. **Production Server Launch**
   ```bash
   npm start
   ```

---
*Developed by College Sports Day Committee &bull; Protected under Apache-2.0 License.*
