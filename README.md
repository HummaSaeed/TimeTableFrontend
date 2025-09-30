# 🏫 Timetable Management System

A comprehensive, modern web application for managing school timetables with advanced features including import functionality, automated generation, and unified data management.

## ✨ Features

### 🆕 **New Features (Latest Update)**
- **📥 Timetable Import**: Import existing timetables from Excel/CSV files
- **🔧 Unified Data Management**: Manage teachers, classes, and subjects in one interface
- **📊 Enhanced Dashboard**: Comprehensive overview with quick actions and statistics
- **🛡️ Error Boundary**: Graceful error handling and recovery
- **🏥 System Health Check**: Monitor and test system functionality
- **🎨 Modern UI**: Beautiful, responsive design with consistent styling

### 🎯 **Core Functionality**
- **👨‍🏫 Teacher Management**: Complete CRUD operations for faculty
- **🏫 Class Management**: Handle classes, sections, and student counts
- **📚 Subject Management**: Organize courses and curriculum
- **📅 Timetable Generation**: AI-powered automatic timetable creation
- **📋 Assignment Management**: Link teachers to subjects and classes
- **⚙️ School Profile**: Comprehensive school information management
- **🔐 Authentication**: Secure login with role-based access

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Django backend running on localhost:8000

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timetablewebapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
timetablewebapp/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Auth/            # Authentication components
│   │   ├── Layout/          # Layout and navigation
│   │   └── ErrorBoundary.js # Error handling
│   ├── contexts/            # React contexts
│   │   └── AuthContext.js   # Authentication state
│   ├── pages/               # Main application pages
│   │   ├── Dashboard/       # Dashboard components
│   │   ├── Teachers/        # Teacher management
│   │   ├── Classes/         # Class management
│   │   ├── Subjects/        # Subject management
│   │   ├── Timetable/       # Timetable features
│   │   ├── DataManagement/  # Unified data management
│   │   └── Settings/        # System settings
│   ├── services/            # API and external services
│   │   └── api.js          # API endpoints and methods
│   └── styles/              # CSS and styling
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration

### API Configuration
Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Your Django server URL
```

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

## 📱 Usage Guide

### 1. **Getting Started**
- Navigate to `/login` to sign in
- Use demo account: `demo@school.com` / `demo123`
- Or register a new school account

### 2. **Import Existing Timetable**
1. Go to **Dashboard** → **Import Existing Timetable**
2. Upload your Excel/CSV file
3. Map columns to system fields
4. Preview and validate data
5. Click **Import Timetable**

### 3. **Manage Data**
1. Navigate to **Data Management**
2. Use tabs to switch between Teachers, Classes, and Subjects
3. Add, edit, or delete items as needed
4. Use search and filters to find specific items

### 4. **Generate New Timetable**
1. Go to **Timetable** → **Generate Timetable**
2. Configure generation parameters
3. Click **Generate Timetable**
4. Review and adjust as needed

### 5. **System Health Check**
1. Go to **Settings** → **System Health**
2. Click **Run Health Check**
3. Review test results and recommendations

## 🔌 API Endpoints

### Authentication
- `POST /api/login/` - School login
- `POST /api/teacher/login/` - Teacher login
- `POST /api/register/` - School registration
- `POST /api/token/refresh/` - Token refresh

### Data Management
- `GET/POST /api/teachers/` - Teacher CRUD
- `GET/POST /api/classes/` - Class CRUD
- `GET/POST /api/subjects/` - Subject CRUD
- `GET/POST /api/school-profile/` - School profile

### Timetable
- `GET/POST /api/timetable/slots/` - Timetable slots
- `POST /api/timetable/generate/` - Generate timetable
- `POST /api/timetable/import/` - Import timetable

## 🎨 UI Components

### Design System
- **Bootstrap 5**: Modern, responsive framework
- **Custom CSS**: Consistent styling and branding
- **Font Awesome**: Professional icon set
- **Responsive Design**: Mobile-first approach

### Key Components
- **Modal Forms**: Clean, focused input interfaces
- **Data Tables**: Sortable, filterable data display
- **Progress Indicators**: Loading states and progress bars
- **Alert System**: Success, error, and info notifications

## 🛡️ Error Handling

### Error Boundary
- Catches runtime errors gracefully
- Provides user-friendly error messages
- Offers recovery options (reload, go home)
- Generates error reports for debugging

### API Error Handling
- Automatic token refresh on 401 errors
- Graceful fallback for network issues
- User-friendly error messages
- Retry mechanisms for failed requests

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure token storage
- Role-based access control

### Data Protection
- Input validation and sanitization
- CSRF protection
- Secure API communication
- Session management

## 📊 Performance Optimization

### Code Splitting
- Lazy loading of components
- Route-based code splitting
- Optimized bundle sizes

### Caching
- API response caching
- Local storage for user preferences
- Efficient state management

## 🧪 Testing

### Manual Testing
1. **Login Flow**: Test authentication with valid/invalid credentials
2. **Data Management**: Test CRUD operations for all entities
3. **Timetable Import**: Test file upload and data mapping
4. **Error Handling**: Test error scenarios and recovery
5. **Responsive Design**: Test on different screen sizes

### Automated Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production API URL
3. Enable HTTPS
4. Set up CDN for static assets

### Deployment Options
- **Netlify**: Static site hosting
- **Vercel**: React-optimized hosting
- **AWS S3**: Scalable static hosting
- **Heroku**: Full-stack deployment

## 🐛 Troubleshooting

### Common Issues

#### 1. **Login Not Working**
- Check if Django backend is running
- Verify API URL configuration
- Check browser console for errors
- Clear browser cache and cookies

#### 2. **Import Not Working**
- Ensure file format is CSV or Excel
- Check file size (max 10MB)
- Verify column mapping
- Check browser console for errors

#### 3. **Data Not Loading**
- Check API connectivity
- Verify authentication tokens
- Check network tab for failed requests
- Run system health check

### Debug Mode
Enable debug mode in browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📚 API Documentation

### Request Format
```javascript
// Example API call
const response = await teachersAPI.create({
  name: 'John Doe',
  email: 'john@school.com',
  subject_specialists: ['Mathematics', 'Physics']
});
```

### Response Format
```javascript
{
  data: {
    id: 1,
    name: 'John Doe',
    email: 'john@school.com',
    // ... other fields
  },
  status: 201
}
```

## 🔄 Migration Guide

### From Previous Version
1. **Backup Data**: Export existing data
2. **Update Dependencies**: Run `npm install`
3. **Database Migration**: Follow Django migration steps
4. **Test Functionality**: Verify all features work
5. **Update Configuration**: Review new settings

### Breaking Changes
- None in this version
- All existing functionality preserved
- New features are additive

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards
- ESLint configuration
- Prettier formatting
- React best practices
- Accessibility guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [User Guide](docs/USER_GUIDE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

### Getting Help
- **Issues**: GitHub issue tracker
- **Discussions**: GitHub discussions
- **Email**: support@timetablesystem.com

### Community
- **Forum**: Community support forum
- **Discord**: Real-time chat support
- **YouTube**: Video tutorials

## 🎉 Acknowledgments

- **Bootstrap Team**: UI framework
- **React Team**: Frontend library
- **Font Awesome**: Icon library
- **Open Source Community**: Libraries and tools

---

**Made with ❤️ for better education management**
