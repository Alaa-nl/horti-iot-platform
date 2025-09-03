# HORTI-IOT Web Platform - Setup Guide

## 🚀 Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API endpoints
```

3. **Start development server**
```bash
npm start
```

## 📦 Dependencies Installed

- **React 18** with TypeScript
- **React Router DOM** for routing
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Axios** for API calls
- **JWT Decode** for authentication
- **Headless UI & Heroicons** for components

## 🏗️ Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── common/         # Reusable components
├── pages/              # Page components
├── services/           # API services
├── context/            # React contexts
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## 🔐 Authentication

The platform uses JWT-based authentication with role-based access control:

- **Researchers**: Access to data analytics, ML predictions, sensor monitoring
- **Growers**: Access to financial dashboards, ROI analysis, business metrics

### Demo Credentials

- **Researcher**: researcher@demo.com / demo123
- **Grower**: grower@demo.com / demo123

## 🎨 UI Features

- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Animations**: Smooth transitions with Framer Motion
- **Responsive**: Mobile-first responsive design
- **Data Visualization**: Interactive charts with Recharts
- **Real-time Updates**: Live data simulation

## 🚧 Next Steps

1. **Backend Integration**: Connect to actual API endpoints
2. **Real-time Data**: Implement WebSocket connections
3. **Camera Integration**: Add RGBD camera functionality
4. **ML Models**: Connect to machine learning services
5. **Advanced Features**: Add data export, notifications, etc.

## 📱 Available Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm run lint` - Run linting

## 🔧 Configuration

Update `.env` file with your API endpoints:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ML_SERVICE_URL=http://localhost:8000
```

## 🌟 Features Implemented

### ✅ Authentication System
- JWT token management
- Role-based routing
- Protected routes
- Auto-logout on token expiration

### ✅ Researcher Dashboard
- Real-time climate monitoring
- Interactive data visualization
- ML prediction display
- Sensor status overview

### ✅ Grower Dashboard
- Financial metrics tracking
- Revenue vs costs analysis
- ROI calculations
- Investment breakdown

### ✅ Professional UI
- Modern login page with role selection
- Responsive layout with sidebar navigation
- Beautiful animations and transitions
- Professional color scheme

## 🔮 Future Enhancements

- Real-time WebSocket integration
- Advanced ML model integration
- Camera image analysis
- Data export functionality
- Advanced reporting system
- Multi-greenhouse support