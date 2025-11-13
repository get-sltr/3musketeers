# 🐳 Docker Setup for SLTR

## Quick Start

### Development with Docker Compose

```bash
# Start all services (app + Redis)
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Build

```bash
# Build the Docker image
docker build -t sltr-app .

# Run the container
docker run -p 3000:3000 --env-file .env.local sltr-app
```

## What's Included

### Services

1. **app** - SLTR Next.js application
   - Port: 3000
   - Hot reload enabled in development
   - Multi-stage build for optimal size

2. **redis** - Redis cache server
   - Port: 6379
   - Persistent data storage
   - Used for real-time features and caching

### Docker Files

- **Dockerfile** - Multi-stage production build
- **docker-compose.yml** - Orchestrates app + services
- **.dockerignore** - Excludes unnecessary files

## Environment Variables

Make sure you have `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PRICE_MEMBER=price_xxx
STRIPE_PRICE_FOUNDER=price_xxx
STRIPE_PRICE_BLACKCARD=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# OpenAI (EROS)
OPENAI_API_KEY=your_openai_key
```

## Common Commands

### View Running Containers
```bash
docker ps
```

### Access Shell in Running Container
```bash
docker exec -it sltr-app sh
```

### Check Redis
```bash
docker exec -it sltr-redis redis-cli ping
```

### Clean Up
```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove all images
docker rmi sltr-app
```

## Deployment

### Deploy to Cloud

**AWS ECS / DigitalOcean / Google Cloud:**
1. Push image to registry
2. Configure cloud service to pull image
3. Set environment variables
4. Deploy

**Vercel/Netlify:**
- These platforms build from source
- Docker not needed for these platforms

### Docker Hub (Optional)

```bash
# Tag the image
docker tag sltr-app your-username/sltr-app:latest

# Push to Docker Hub
docker push your-username/sltr-app:latest

# Pull on production server
docker pull your-username/sltr-app:latest
docker run -p 3000:3000 --env-file .env.production your-username/sltr-app:latest
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

### Out of Disk Space
```bash
# Clean up unused images/containers
docker system prune -a
```

## Benefits

✅ **Consistent Environment** - Same setup everywhere
✅ **Easy Onboarding** - New devs just run `docker-compose up`
✅ **Isolation** - No conflicts with other projects
✅ **Scalability** - Easy to add more services
✅ **Cloud Ready** - Deploy to any Docker-compatible platform
