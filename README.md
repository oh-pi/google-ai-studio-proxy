# Gemini Smart Router API

## Overview

This project provides a local server that exposes an OpenAI-compatible `/v1/chat/completions` endpoint, powered by Google's Gemini models. Its core feature is a "smart router" that first classifies a user's query as either 'TRIVIAL' or 'COMPLEX'. It then automatically selects the most appropriate and cost-effective Gemini model to generate the response.

This package includes a self-contained installer that sets up the application and all its dependencies, including Homebrew, on macOS and Linux.

-   **Trivial Queries**: Handled by `gemini-2.5-flash` for fast, inexpensive answers.
-   **Complex Queries**: Handled by `gemini-2.5-flash` (configurable to a more powerful model) for in-depth, nuanced responses.

## Features

-   **Automated Installation**: A single script handles all setup on macOS and Ubuntu 22.04+.
-   **Run as a Service**: Easily start and stop the server as a background service using Homebrew services.
-   **OpenAI `/v1/chat/completions` Compatibility**: Drop-in replacement for any service using this API format.
-   **Automatic Model Switching**: Intelligently routes queries to optimize for cost and performance.
-   **Streaming Support**: Handles `stream: true` requests for real-time, token-by-token responses.

## Prerequisites

-   A macOS or Ubuntu 22.04+ system.
-   Standard build tools (`git`, `curl`, `build-essential` on Ubuntu). The installer will prompt for them if missing.
-   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation

1.  **Clone or download the project files.**

2.  **Run the Installer Script:**

    Open your terminal, navigate to the project directory, and run the installer.

    ```bash
    # Make the script executable
    chmod +x install.sh

    # Run the installer
    ./install.sh
    ```
    The script will guide you through the process. It will:
    - Detect your OS.
    - Install Homebrew if it's not already present.
    - Install Node.js using Homebrew.
    - Build the application and set it up as a command-line tool.

3.  **Configure your API Key:**

    The installer will create a configuration file and prompt you to edit it. You **must** add your API key to this file.

    ```bash
    # The installer will provide the correct path for your system. It will look like:
    # On macOS (Apple Silicon):
    nano /opt/homebrew/etc/gemini-smart-router-api/.env
    # On Linux:
    nano /home/linuxbrew/.linuxbrew/etc/gemini-smart-router-api/.env
    ```
    Inside the file, replace `YOUR_GEMINI_API_KEY` with your actual Google Gemini API key and save it.

## Running the Server

The recommended way to run the server is as a background service using `brew services`.

-   **To start the server and have it run automatically on login:**
    ```bash
    brew services start gemini-smart-router-api
    ```

-   **To stop the server:**
    ```bash
    brew services stop gemini-smart-router-api
    ```

-   **To run the server in the foreground for debugging:**
    ```bash
    gemini-smart-router-api
    ```

The server will start on `http://localhost:3000` by default. You can change the port in the `.env` configuration file.

## API Endpoint

-   **URL**: `http://localhost:3000/v1/chat/completions`
-   **Method**: `POST`
-   **Body**: JSON, compatible with the OpenAI Chat Completions API. The `model` field is ignored.

## Usage Example (cURL)

Once the service is running, you can send requests to it.

### Streaming Request

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Explain the concept of quantum entanglement in simple terms."
      }
    ],
    "stream": true
  }'
```

The server will classify this as **COMPLEX**, use the appropriate model, and stream back the response chunk by chunk.
