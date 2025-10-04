# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install GDAL and its dependencies
RUN apk add --no-cache \
    gdal \
    gdal-dev \
    python3 \
    py3-pip \
    build-base \
    && rm -rf /var/cache/apk/*

# Set GDAL environment variables
ENV GDAL_DATA=/usr/share/gdal
ENV PROJ_LIB=/usr/share/proj

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
