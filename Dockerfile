# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install GDAL and its dependencies
RUN apk add --no-cache \
    gdal \
    gdal-dev \
    gdal-tools \
    python3 \
    py3-pip \
    build-base \
    proj \
    geos \
    geos-dev \
    && rm -rf /var/cache/apk/*

# Set GDAL environment variables
ENV GDAL_DATA=/usr/share/gdal
ENV PROJ_LIB=/usr/share/proj

# Verify GDAL installation
RUN gdalinfo --version && gdal_translate --version

# Test GDAL paths
RUN which gdalinfo && which gdal_translate

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
