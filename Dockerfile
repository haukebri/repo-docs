# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build args and convert to env vars
ARG VITE_API_BASE_URL
ARG VITE_GITHUB_REPO_URL
ARG VITE_GITHUB_TOKEN
ARG VITE_OPENAI_API_KEY
# ...add all your VITE_ variables here

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GITHUB_REPO_URL=$VITE_GITHUB_REPO_URL
ENV VITE_GITHUB_TOKEN=$VITE_GITHUB_TOKEN
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
# ...and here

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Vite project
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the Vite static output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]