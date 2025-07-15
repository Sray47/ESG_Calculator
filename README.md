# BRSR ESG Calculator

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-red.svg)](./LICENSE)

A comprehensive **Business Responsibility and Sustainability Reporting (BRSR)** platform designed for Indian listed companies to streamline ESG compliance and reporting as mandated by SEBI. This full-stack application automates the creation, management, and generation of professional sustainability reports covering all 9 BRSR principles.

## Purpose

Built specifically for **SEBI-listed entities** in India, this platform addresses the mandatory BRSR compliance requirements by providing:
- **Automated ESG scoring** across Environment, Social, and Governance pillars
- **Comprehensive data collection** for all 9 BRSR principles
- **Professional PDF generation** with charts and visualizations
- **Regulatory compliance** with Section A, B, and C reporting requirements

## Key Features

### **Complete BRSR Framework Implementation**
- **Section A**: General Disclosures (Company profile, operations, stakeholder engagement)
- **Section B**: Management & Process Disclosures (Policies and governance structures)
- **Section C**: Principle-wise Performance Disclosures (All 9 ESG principles)

### **Enterprise-Grade Security**
- Dual authentication system (Supabase Auth + Custom JWT)
- Role-based access control
- Secure data encryption and validation
- Rate limiting and DDoS protection

### **Advanced ESG Analytics**
- **Automated scoring engine** with 6000+ point framework
- **Year-over-year comparisons** and trend analysis
- **Visual dashboards** with Chart.js integration

### **Professional Report Generation**
- **Corporate-standard PDF reports** with automated calculations
- **Dynamic charts and visualizations** embedded in reports
- **Regulatory-compliant formatting** matching SEBI requirements

### **Production Features**
- **Vercel Serverless** deployment with automatic scaling
- **Multi-layer validation** (client-side, API, database)

##  Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **PostgreSQL database** 
- **Git** for version control

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ESG_Calculator
   
   # Backend setup
   cd brsr_backend && npm install
   
   # Frontend setup  
   cd ../brsr_frontend && npm install
   ```

2. **Environment Configuration**
   ```bash
   # Backend environment
   cp brsr_backend/.env.example brsr_backend/.env
   
   # Frontend environment
   cp brsr_frontend/.env.example brsr_frontend/.env
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend (Port 3050)
   cd brsr_backend && npm run dev
   
   # Terminal 2 - Frontend (Port 5173)
   cd brsr_frontend && npm run dev
   ```

4. **Access Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3050


## Deployment

### **Production Deployment (Vercel)**
This application is optimized for **Vercel's serverless platform** with automatic scaling and global CDN.

```bash
# Deploy backend
vercel --prod --cwd brsr_backend

# Deploy frontend  
vercel --prod --cwd brsr_frontend
```


## Contributing

We welcome contributions to improve the BRSR ESG Calculator! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/new-feature`)
3. **Commit** your changes (`git commit -m 'Add new feature'`)
4. **Push** to the branch (`git push origin feature/new-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow **TypeScript best practices** and maintain type safety
- Write **comprehensive tests** for new features
- Update **documentation** for API changes
- Ensure **responsive design** for UI modifications
- Follow **ESLint rules** and code formatting standards

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Built for Indian enterprises to achieve ESG excellence and regulatory compliance.** 🇮🇳

> **Note**: This application is designed specifically for SEBI-listed entities in India and follows the official BRSR framework mandated for sustainability reporting.
