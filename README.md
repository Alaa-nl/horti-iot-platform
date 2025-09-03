# 🌱 HORTI-IOT Web Platform

A modern, professional web application for smart greenhouse management, designed for researchers and growers with role-based dashboards and real-time monitoring capabilities.

![Platform Preview](https://via.placeholder.com/800x400/22c55e/ffffff?text=HORTI-IOT+Platform)

## 🚀 Features

### 🔐 Authentication System
- **JWT-based authentication** with secure token management
- **Role-based access control** (Researcher/Grower)
- **Protected routes** with automatic logout on token expiration
- **Professional login interface** with role selection

### 📊 Researcher Dashboard
- **Real-time climate monitoring** (Temperature, Humidity, CO2, Light)
- **Interactive data visualization** with charts and graphs
- **ML predictions display** with confidence scores
- **Sensor status overview** with health monitoring
- **Quick action buttons** for common tasks

### 💼 Grower Dashboard
- **Financial metrics tracking** (Revenue, ROI, Profit Margin)
- **Revenue vs costs analysis** with monthly breakdowns
- **Investment allocation visualization** 
- **Crop performance analytics** with profitability insights
- **Business projections** and forecasting

### 🎨 Modern UI/UX
- **Beautiful, responsive design** built with Tailwind CSS
- **Smooth animations** powered by Framer Motion
- **Professional color scheme** with custom HORTI brand colors
- **Mobile-first responsive layout**
- **Interactive components** with hover effects

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v3
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Authentication**: JWT with jwt-decode
- **UI Components**: Headless UI & Heroicons

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd horti-iot-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm start
```

5. **Build for production**
```bash
npm run build
```

## 🔧 Configuration

Update the `.env` file with your backend API endpoints:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_SERVICE_URL=http://localhost:8000
```

## 🧪 Demo Credentials

The platform includes demo authentication for testing:

| Role | Email | Password |
|------|-------|----------|
| Researcher | researcher@demo.com | demo123 |
| Grower | grower@demo.com | demo123 |

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── ProtectedRoute.tsx
│   │   └── LoginForm.tsx
│   ├── layout/         # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── common/         # Reusable components
│       └── Card.tsx
├── pages/              # Main page components
│   ├── Login.tsx
│   ├── ResearcherDashboard.tsx
│   └── GrowerDashboard.tsx
├── services/           # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── researcher.service.ts
│   └── grower.service.ts
├── context/            # React contexts
│   └── AuthContext.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
└── App.tsx            # Main application component
```

## 🔌 API Integration

The platform is designed to integrate with backend services:

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout  
- `GET /auth/validate` - Token validation
- `POST /auth/refresh` - Token refresh

### Researcher Endpoints
- `GET /climate/current` - Current climate data
- `GET /climate/data` - Historical climate data
- `GET /sensors/data` - Sensor readings
- `POST /ml/predict` - ML predictions
- `POST /camera/upload` - Image upload

### Grower Endpoints
- `GET /financial/summary` - Financial overview
- `GET /financial/revenue` - Revenue data
- `GET /financial/roi` - ROI analysis
- `GET /financial/investments` - Investment tracking

## 🌟 Key Features Implemented

### ✅ Authentication & Security
- JWT token management with automatic refresh
- Role-based routing and access control
- Secure API interceptors
- Token expiration handling

### ✅ Real-time Data Simulation
- Mock data for development and testing
- Simulated real-time updates
- Interactive data visualization
- Responsive chart components

### ✅ Professional UI
- Modern login page with gradient backgrounds
- Animated components and transitions
- Responsive sidebar navigation
- Beautiful data cards and metrics

### ✅ Type Safety
- Full TypeScript implementation
- Comprehensive type definitions
- API response typing
- Component prop validation

## 🚧 Future Enhancements

- **WebSocket Integration**: Real-time data streaming
- **Advanced ML Features**: Model training and deployment
- **Camera Integration**: RGBD image analysis
- **Data Export**: CSV/PDF report generation
- **Multi-greenhouse Support**: Facility management
- **Advanced Analytics**: Predictive insights
- **Mobile App**: React Native companion
- **Notification System**: Alerts and warnings

## 📱 Available Scripts

- `npm start` - Start development server (localhost:3000)
- `npm build` - Create production build
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

## 🔍 Development Notes

### Mock Data
The application currently uses mock data for demonstration. Real data integration requires connecting to actual backend APIs.

### Responsive Design
The interface is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px+) 
- Tablet (768px+)
- Mobile (320px+)

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for smart agriculture and sustainable farming**