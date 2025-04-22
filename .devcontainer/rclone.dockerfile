# rclone.Dockerfile
FROM rclone/rclone:latest

# Switch to root user to install packages (rclone image already runs as root)
# USER root # Not strictly needed as the base image runs as root

# Install inotify-tools using apk (Alpine's package manager)
# and clean up cache in one step
RUN apk update && \
    apk add --no-cache inotify-tools

# Set the working directory (optional, but can be good practice)
WORKDIR /config

# No script copying needed if using inline command
# The script will be executed via the 'command' in docker-compose.yml