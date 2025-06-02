# 🌐 Responsive Tracer

**Responsive Tracer** is a full-stack tool designed to measure and visualize the UI responsiveness of dynamic websites. It automates the analysis of page load time, API latency, DB latency, and overall frontend responsiveness — without relying on manual DevTools inspections.

---

## 🚀 Features

- 🧭 Automatic website crawling and performance metric extraction  
- 📊 Dashboard view with alerts, tables, and charts  
- ⚡ Measures full-page load time, pane-wise loading, progressive data rendering  
- 🧪 Simulates real user sessions  
- 🔍 Supports Lighthouse audits and backend API correlation  
- 🗃️ Database latency monitoring included  

---

## 🧩 Tech Stack

| Layer        | Tech                                  |
|--------------|---------------------------------------|
| Frontend     | React, CSS                            |
| Backend      | Node.js, Express                      |
| DB Latency   | Node.js + SQL (via `db.js`)           |
| Crawling     | Custom logic in `website-crawler.js`  |
| Performance  | Google Lighthouse, Web Vitals         |
| Hosting      | Vercel (Frontend), Render (Backend)   |

---

## 🛠️ Setup Instructions

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/your-username/responsive-tracer.git
cd responsive-tracer/client
```

### 🔹 2. Install Dependencies

#### 🖥️ Frontend
```bash
npm install
```

#### 🗄️ Backend (in sample-db-app)
```bash
cd sample-db-app
npm install
```

---

## 🧪 Run Locally

### ▶️ Frontend (React)
```bash
cd client
npm start
```

### ▶️ Backend (API + DB latency)
```bash
cd client/sample-db-app
npm start
```


