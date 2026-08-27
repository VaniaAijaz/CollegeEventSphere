FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (5000 is internal to the Docker network)
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
