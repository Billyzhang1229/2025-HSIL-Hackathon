# frontend/Dockerfile
# Use an official Node runtime as a parent image
FROM node:20-alpine as build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine as production-stage

WORKDIR /app

# Copy built assets from build stage
COPY --from=build-stage /app/dist ./dist
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose port 3000 (or the port Vite serves on)
EXPOSE 3000

# Command to serve the built app (using Vite preview as an example)
# For a real production deployment, consider using a static file server like Nginx or serve
CMD ["npm", "run", "preview", "--", "--host"] 