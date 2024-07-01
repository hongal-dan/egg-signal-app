# Base image
FROM public.ecr.aws/docker/library/node:21-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
RUN apk add --no-cache \
    bash \
    curl \
    pkgconfig \
    cairo-dev \
    pango-dev \
    libpng-dev \
    jpeg-dev \
    giflib-dev \
    librsvg \
    build-base \
    python3 \
    py3-pip \
    make \
    g++

# Ensure node-gyp can find Python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copy application code
COPY . .

# Install Node.js dependencies
RUN npm ci

# Build the application
RUN npm run build

# Expose the application port
EXPOSE 80

# Command to run the application
CMD ["npm", "run", "start"]
