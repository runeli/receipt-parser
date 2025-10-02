# Docker Deployment Guide

This guide explains how to build and run the Receipt OCR Parser application using Docker.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (optional, usually included with Docker Desktop)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the container
npm run docker:compose:up

# View logs
npm run docker:compose:logs

# Stop and remove the container
npm run docker:compose:down
```

The application will be available at: **http://localhost:8080**

### Using Docker CLI

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run

# Stop and remove the container
npm run docker:stop
```

## Manual Docker Commands

### Build the image

```bash
docker build -t receipt-ocr-parser .
```

### Run the container

```bash
docker run -d -p 8080:80 --name receipt-ocr-parser receipt-ocr-parser
```

### View logs

```bash
docker logs -f receipt-ocr-parser
```

### Stop and remove

```bash
docker stop receipt-ocr-parser
docker rm receipt-ocr-parser
```

## Docker Configuration

### Dockerfile

- **Multi-stage build**: Compiles TypeScript in a Node.js container, then copies the output to a lightweight nginx container
- **Base image**: nginx:alpine (~23MB)
- **Build time**: ~30-60 seconds

### nginx Configuration

- Serves static files from `/usr/share/nginx/html`
- Gzip compression enabled
- Static asset caching (1 year)
- Security headers included
- Health check endpoint: `/health`

### Port Mapping

- Container port: `80`
- Host port: `8080` (configurable in `docker-compose.yml`)

## Customization

### Change Port

Edit `docker-compose.yml`:

```yaml
ports:
  - '3000:80' # Change 3000 to your desired port
```

### Environment Variables

Add to `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
```

## Production Deployment

### Push to Docker Hub

```bash
# Tag the image
docker tag receipt-ocr-parser username/receipt-ocr-parser:1.0.0

# Push to Docker Hub
docker push username/receipt-ocr-parser:1.0.0
```

### Deploy to Server

```bash
# Pull and run on your server
docker pull username/receipt-ocr-parser:1.0.0
docker run -d -p 80:80 --name receipt-ocr-parser username/receipt-ocr-parser:1.0.0
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs receipt-ocr-parser

# Check if port is in use
lsof -i :8080
```

### Image build fails

```bash
# Clean build (no cache)
docker build --no-cache -t receipt-ocr-parser .
```

### Remove all containers and images

```bash
# Stop all containers
docker stop $(docker ps -a -q)

# Remove all containers
docker rm $(docker ps -a -q)

# Remove all images
docker rmi $(docker images -q)
```
