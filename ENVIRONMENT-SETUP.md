# Environment Setup Instructions

## 🚀 Quick Setup

### 1. Frontend Environment (.env.local)
```bash
# Copy the frontend template to .env.local
cp frontend-env-template.txt .env.local
```

### 2. Backend Environment (.env)
```bash
# Copy the backend template to backend/.env
cp backend-env-template.txt backend/.env
```

### 3. Verify Setup
```bash
# Test frontend environment
npm run dev

# Test backend environment (in separate terminal)
cd backend && npm start
```

## 🔧 Configuration Details

### Frontend (.env.local)
- **Supabase**: Database and authentication
- **URLs**: Production and development endpoints
- **Feature Flags**: Enable/disable features
- **Security**: Panic button and reporting

### Backend (.env)
- **Supabase**: Server-side database access
- **Security**: JWT secrets and rate limiting
- **File Upload**: Size limits and directories
- **Monitoring**: Sentry and logging
- **Features**: Video calls, AI, location tracking

## ⚠️ Important Notes

1. **Never commit .env files** to version control
2. **Update URLs** for your actual domains
3. **Generate secure secrets** for JWT and sessions
4. **Configure Redis** when implementing caching
5. **Set up Sentry** for error tracking

## 🔒 Security Checklist

- [ ] Environment files created
- [ ] Supabase credentials configured
- [ ] JWT secrets generated
- [ ] Rate limiting configured
- [ ] File upload limits set
- [ ] Monitoring configured








