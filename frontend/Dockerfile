# Use the official Node.js 20 Alpine Linux image as the base.
# Alpine is selected because it is a very lightweight and secure distribution.
FROM node:20-alpine

# Set the working directory inside the container to /app.
# All subsequent instructions will run inside this folder.
WORKDIR /app

# Copy package.json and package-lock.json (if present) to the container.
# Copying these before copying the full source code allows Docker to cache the npm install layer.
# The cache will only bust if these files are changed.
COPY package.json package-lock.json* ./

# Install project dependencies.
# Since we are running the React dev server using Vite (npm run dev),
# we need to install all dependencies including devDependencies.
RUN npm install

# Copy all the remaining files from the frontend directory to the container.
COPY . .

# Expose port 3000 to the outside of the container.
# This matches the port configured in vite.config.js for the development server.
EXPOSE 3000

# Start the application using npm run dev.
# We pass the "--host" flag to Vite so that it listens on all network interfaces (0.0.0.0).
# This is crucial so that the port mapped in Docker Compose can be accessed from the host machine.
CMD ["npm", "run", "dev", "--", "--host"]
