# RentIQ

**Modern Rental Intelligence Platform**

> Streamline property management with automation, real-time analytics, and intelligent insights.

[![GitHub stars](https://img.shields.io/github/stars/phantom-0994/rentIQ_?style=social)](https://github.com/phantom-0994/rentIQ_/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/phantom-0994/rentIQ_?style=social)](https://github.com/phantom-0994/rentIQ_/network/members)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Overview

RentIQ is a comprehensive rental management platform designed for landlords, property managers, and tenants. It simplifies property operations through intelligent automation, transparent communication channels, and data-driven insights. Whether you're managing a single unit or a portfolio of properties, RentIQ provides the tools you need to optimize occupancy, streamline payments, and maintain healthy tenant relationships.

---

## ✨ Features

### Core Capabilities

- **🏠 Property Portfolio Management** — Centralized dashboard for managing multiple properties, units, and leases with complete operational visibility
- **👥 Tenant Lifecycle Management** — Automated onboarding, lease tracking, renewal notifications, and tenant communication workflows
- **💳 Payment Processing & Tracking** — Integrated payment gateway with automated rent collection, late fee calculations, and payment history
- **📊 Analytics & Reporting** — Real-time insights on occupancy rates, cash flow, maintenance costs, and ROI with exportable reports
- **🔔 Smart Notifications** — Automated alerts for lease expirations, maintenance requests, payment due dates, and compliance deadlines
- **🛠️ Maintenance Request System** — Ticketing system for tenant issues with status tracking, vendor assignment, and completion workflows
- **📄 Document Management** — Secure storage for leases, agreements, inspection reports, and tenant documents with version control
- **🔐 Role-Based Access Control** — Granular permissions for landlords, property managers, tenants, and maintenance staff

---

## 🚀 Tech Stack

### Frontend
- **React** — Modern UI framework with hooks and context API
- **TypeScript** — Type-safe development with enhanced IDE support
- **CSS3** — Responsive styling with modern layout techniques
- **HTML5** — Semantic markup for accessibility

### Backend
- **Node.js** — High-performance JavaScript runtime
- **Express.js** — RESTful API server framework
- **TypeScript** — Type-safe backend logic

### Infrastructure
- **Docker** — Containerized deployment for consistent environments
- **Database** — MongoDB/PostgreSQL (configurable)
- **Authentication** — JWT-based secure authentication
- **Cloud Storage** — AWS S3/Firebase Storage for documents

### Development Tools
- **Git** — Version control and collaboration
- **ESLint** — Code quality and consistency
- **Prettier** — Code formatting
- **Jest** — Unit and integration testing

---

## 📦 Installation & Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **npm** or **yarn** — Package manager
- **Docker** (optional) — For containerized deployment
- **Git** — Version control

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/phantom-0994/rentIQ_.git
cd rentIQ_
```

2. **Install dependencies**

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. **Configure environment variables**

Create `.env` files in both `frontend` and `backend` directories:

**Backend `.env`:**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
PAYMENT_GATEWAY_KEY=your_payment_api_key
CLOUD_STORAGE_BUCKET=your_storage_bucket
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

4. **Run the application**

**Development mode:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Production mode:**

```bash
# Build frontend
cd frontend
npm run build

# Start backend with production build
cd ../backend
npm run start:prod
```

5. **Access the application**

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### Docker Deployment (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

---

## 🎯 Usage

### For Landlords / Property Managers

1. **Set up your account** — Register and verify your email
2. **Add properties** — Input property details, units, and amenities
3. **Onboard tenants** — Create tenant profiles and assign units
4. **Configure payment terms** — Set rent amounts, due dates, and payment methods
5. **Monitor dashboard** — Track occupancy, payments, and maintenance requests in real-time
6. **Generate reports** — Export financial and operational reports for analysis

### For Tenants

1. **Receive invitation** — Get onboarding email from property manager
2. **Create profile** — Set up account and verify identity
3. **View lease details** — Access rental agreement and property information
4. **Make payments** — Pay rent through integrated payment gateway
5. **Submit maintenance requests** — Report issues and track resolution status
6. **View payment history** — Access receipts and payment records

### Example Workflow

```
Landlord adds property → Creates unit listings → Invites tenant
→ Tenant accepts and signs lease → Automated payment reminders sent
→ Tenant pays rent via platform → Payment recorded in dashboard
→ Tenant submits maintenance request → Landlord assigns vendor
→ Vendor completes work → Tenant confirms completion
```

---

## 📂 Project Structure

```
rentIQ_/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── config/            # Configuration files
│   ├── tests/                 # Backend tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Context providers
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # Global styles
│   │   └── App.tsx            # Root component
│   ├── tests/                 # Frontend tests
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   └── guides/                # User guides
│
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Docker configuration
├── .gitignore                 # Git ignore rules
├── package.json               # Root package file
└── README.md                  # This file
```

---

## 🗺️ Roadmap

### Phase 1: Core Enhancement (Q2 2026)
- [ ] AI-powered rent price optimization based on market trends
- [ ] Predictive maintenance alerts using historical data
- [ ] Advanced tenant screening with credit checks integration
- [ ] Multi-currency support for international properties

### Phase 2: Automation & Intelligence (Q3 2026)
- [ ] Automated lease generation with smart contract templates
- [ ] AI chatbot for tenant support and FAQ handling
- [ ] Occupancy forecasting and vacancy predictions
- [ ] Integration with property listing platforms (Zillow, Apartments.com)

### Phase 3: Mobile & Expansion (Q4 2026)
- [ ] Native iOS and Android mobile applications
- [ ] Offline mode with data synchronization
- [ ] Property inspection module with photo documentation
- [ ] Vendor marketplace for maintenance services

### Phase 4: Enterprise Features (2027)
- [ ] Multi-portfolio management for enterprise clients
- [ ] Advanced compliance tracking (local, state, federal)
- [ ] Custom branding and white-label solutions
- [ ] API access for third-party integrations

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/rentIQ_.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style and conventions
   - Add tests for new features
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code refactoring
   - `test:` for tests
   - `chore:` for maintenance

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all tests pass

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best outcome for the project
- Follow the project's coding standards

### Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/phantom-0994/rentIQ_/issues) with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 👥 Authors & Acknowledgments

**Created by:** [@phantom-0994](https://github.com/phantom-0994)

### Special Thanks

- All contributors who have helped improve RentIQ
- Open-source libraries that power this platform
- The developer community for feedback and support

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/phantom-0994/rentIQ_/issues)
- **Discussions:** [GitHub Discussions](https://github.com/phantom-0994/rentIQ_/discussions)
- **Email:** support@rentiq.example.com *(update with actual contact)*

---

## 🌟 Show Your Support

If you find RentIQ helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code
- 📣 Sharing with others

---

**Built with ❤️ for modern property management**
