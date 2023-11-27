# stage1 as builder
FROM node:18 as builder

WORKDIR /vue

# Copy the package.json and install dependencies
COPY package*.json ./

RUN npm install --verbose

# Copy rest of the files
COPY . .

ARG DEV_MODE
# Set environment variable
ENV NODE_ENV $DEV_MODE

# Build the project
RUN npm run build -- --mode $NODE_ENV


# nginx state for serving content
FROM nginx:stable

RUN ln -fs /usr/share/zoneinfo/Europe/Kiev /etc/localtime
# Install utilities
#RUN apt-get update --fix-missing && apt-get -y upgrade && apt-get -y install wget gnupg mc

# Copy nginx configuration file
COPY --from=builder /vue/nginx.conf /etc/nginx/nginx.conf

# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=builder /vue/dist .

EXPOSE 80 443 22

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
#ENTRYPOINT ["nginx", "-g", "daemon off;"]


