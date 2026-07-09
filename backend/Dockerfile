# Use the official Python 3.10 slim image as the base image.
# The slim variant is preferred for production as it is lightweight and secure, containing only minimal packages.
FROM python:3.10-slim

# Prevent Python from writing .pyc files (compiled bytecode) to disk.
# This helps keep the container clean and reduces unnecessary disk writes.
ENV PYTHONDONTWRITEBYTECODE=1

# Prevent Python from buffering stdout and stderr.
# This ensures that logs are output in real-time, making it easier to debug in container environments.
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container.
# All subsequent instructions (COPY, RUN, CMD) will be run relative to this folder.
WORKDIR /app

# Copy the requirements file into the working directory first.
# By doing this before copying the rest of the source code, we can leverage Docker's build cache.
# Docker will skip reinstalling packages on subsequent builds unless requirements.txt changes.
COPY requirements.txt .

# Install the Python dependencies listed in requirements.txt.
# --no-cache-dir is used to prevent pip from caching the downloaded packages, reducing the final image size.
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the remaining files from the local backend directory to the container's working directory.
# This includes app.py, the saved Keras/H5 model, and any helper files.
COPY . .

# Expose port 5000, which is the default port the Flask application is configured to run on.
# Note: This is documentation for Docker; we still need to publish/map the port when running the container.
EXPOSE 5000

# Specify the default command to execute when the container starts.
# Runs the Flask application using Python.
CMD ["python", "app.py"]
