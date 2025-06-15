# BRSR ESG Calculator

A comprehensive ESG (Environmental, Social, and Governance) calculator built using the BRSR (Business Responsibility and Sustainability Reporting) framework. This application helps companies create, manage, and generate detailed sustainability reports.

## Features

- **User Authentication**: Secure registration and login system
- **Company Profile Management**: Complete company information management
- **BRSR Report Creation**: Comprehensive reporting across all 9 principles
- **ESG Scoring**: Automated calculation of ESG scores with detailed breakdowns
- **PDF Generation**: Professional PDF reports with charts and visualizations
- **Data Persistence**: Secure data storage with PostgreSQL
- **Responsive Design**: Modern, mobile-friendly interface

## Technology Stack

### Frontend
- **React 19** with Vite
- **TypeScript** for type safety
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Zustand** for state management
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Supabase** for authentication and database hosting
- **JWT** for secure authentication
- **PDFKit** for PDF generation
- **Chart.js** for data visualization

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ESG_Calculator
   ```

2. **Backend Setup**
   ```bash
   cd brsr_backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd brsr_frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3050

## Deployment

### Vercel Deployment (Recommended)

This application is optimized for Vercel's serverless platform. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

**Key Features for Production:**
- Serverless backend with automatic scaling
- In-memory PDF generation for optimal performance
- Environment-based configuration
- Secure CORS handling
- Production-ready error handling

### Environment Variables

**Backend (.env):**
```
DB_HOST=your-database-host
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
DB_PORT=5432
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

**Frontend (.env):**
```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```
ESG_Calculator/
├── brsr_backend/          # Node.js Express backend
│   ├── server.js          # Main server file
│   ├── authRoutes.js      # Authentication endpoints
│   ├── companyRoutes.js   # Company management
│   ├── reportRoutes.js    # BRSR report handling
│   ├── pdfGenerator_fixed.js # PDF generation
│   └── ...
├── brsr_frontend/         # React Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── ...
│   └── ...
├── vercel.json           # Vercel deployment configuration
└── VERCEL_DEPLOYMENT.md  # Detailed deployment guide
```

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Reports
- `GET /api/reports` - List all reports
- `POST /api/reports/initiate` - Start new report
- `PUT /api/reports/:id` - Update report data
- `POST /api/reports/:id/submit` - Submit final report
- `GET /api/reports/:id/pdf` - Download PDF report

### Company
- `GET /api/company/profile` - Get company profile
- `PUT /api/company/profile` - Update company profile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For deployment assistance or technical support, refer to:
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Frontend Environment Setup](./brsr_frontend/.env.example)
- Project issues and documentation
