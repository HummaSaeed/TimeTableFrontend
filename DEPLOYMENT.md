# Frontend Deployment Guide for TimetableAdmin.com

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Environment Configuration
The frontend is now configured to work with the live backend at `http://timetableadmin.com`.

### API Configuration
- Base URL: `http://timetableadmin.com`
- All API endpoints are configured to use this base URL
- CORS is properly configured on the backend to allow requests from the frontend

## Build and Deploy

### 1. Install Dependencies
```bash
cd timetablewebapp
npm install
```

### 2. Build for Production
```bash
npm run build
```

### 3. Deploy Options

#### Option A: Static Hosting (Recommended)
Deploy the `build` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

#### Option B: Same Server as Backend
If deploying on the same server as the backend:

1. Copy the `build` folder to your web server directory
2. Configure Nginx to serve the React app:

```nginx
server {
    listen 80;
    server_name timetableadmin.com www.timetableadmin.com;
    
    # Serve React app
    location / {
        root /path/to/timetablewebapp/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy admin requests to Django
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Testing
After deployment, test the following:
1. Registration: `http://timetableadmin.com/register`
2. Login: `http://timetableadmin.com/login`
3. Dashboard: `http://timetableadmin.com/dashboard`
4. All CRUD operations for teachers, classes, subjects, and timetable

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the backend CORS settings include your frontend domain.

### API Connection Issues
Check that:
1. Backend is running on `http://timetableadmin.com`
2. All API endpoints are accessible
3. CORS is properly configured

### Build Issues
If build fails:
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear build cache: `npm run build -- --no-cache`
3. Check for any linting errors

## Notes
- The frontend is configured to work with HTTP (not HTTPS) for now
- All API calls are made to `http://timetableadmin.com`
- Authentication tokens are stored in localStorage
- The app supports both school admin and teacher login types


