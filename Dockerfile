# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY public ./public
COPY src ./src
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_ML_SERVICE_URL
ARG NODE_ENV=production

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ML_SERVICE_URL=$REACT_APP_ML_SERVICE_URL
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]