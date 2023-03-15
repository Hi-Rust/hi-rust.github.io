# Use a smaller base image
FROM node:alpine as base

RUN apk --no-cache add pkgconfig autoconf automake libtool nasm build-base zlib-dev

# Set the working directory to /app
WORKDIR /app

# Copy package.json and yarn.lock files to the container
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --production && \
    yarn cache clean

# Use a separate build stage to compile the application
FROM base as build

# Copy the rest of the application files to the container
COPY . .

# Build the application
RUN npm run build && \
    npm prune --production 

# Use a minimal base image for the final image
FROM node:alpine

# Set the working directory to /app
WORKDIR /app

# Copy the application files from the build stage to the final image
COPY --from=build /app .

# Expose port 8089 for the application
EXPOSE 8089

# Start the application when the container starts
CMD ["npm", "run", "serve"]
