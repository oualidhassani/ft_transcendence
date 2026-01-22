# ft_transcendence

**ft_transcendence** is a comprehensive full-stack web application developed as the final project for the 42 School Common Core. This project implements a real-time multiplayer Pong game, complete with a live chat system, user authentication, and an AI opponent, all orchestrated via a modern microservices architecture.

## 🚀 Features

-   **Real-Time Multiplayer Pong**: Play Pong against other users with low-latency updates.
-   **Live Chat System**: Real-time messaging with support for public and private channels.
-   **Authentication & Authorization**: Secure login system using JWT and Google OAuth strategies.
-   **AI Opponent**: Challenge an AI-powered player when human opponents aren't available.
-   **User Profiles**: Track stats, match history, and manage avatars.
-   **Security**: HTTPS enabled by default with auto-generated self-signed certificates.

## 🛠 Tech Stack

The project utilizes a modern and robust technology stack, containerized with Docker for consistency.

### Frontend
-   **Framework**: TypeScript with Vite (Static Site Generation/SPA)
-   **Styling**: Tailwind CSS
-   **Real-time Communication**: Socket.io Client

### Backend Services
The backend is split into multiple microservices:
-   **Auth Service**: Node.js, Fastify, Passport.js (Google OAuth), JWT
-   **Chat Service**: Node.js, Fastify, Socket.io
-   **Game Service**: Node.js (Game Logic)
-   **AI Service**: Node.js, Express, WebSocket (`ws`)
-   **API Gateway / Proxy**: Nginx

### Database & Storage
-   **Database**: SQLite (Development/Simplicity), managed via **Prisma ORM**.
-   **Shared Schemas**: Centralized database schema and client in `Shared_dataBase`.

### DevOps & Infrastructure
-   **Containerization**: Docker & Docker Compose
-   **Orchestration**: Docker Compose
-   **Scripts**: Makefile for easy management, Bash scripts for SSL generation.

## 📂 Project Structure

```bash
ft_transcendence/
├── Makefile                # Command center for building and running the project
├── docker-compose.yml      # Orchestration of all microservices
├── generate_cert.sh        # Auto-generates SSL certificates based on local IP
├── .env                    # Environment configuration (generated/managed automatically)
├── frontend/               # React/Vite Frontend application
├── services/               # Backend Microservices
│   ├── auth-service/       # Authentication logic
│   ├── chat-service/       # Chat functionalities
│   ├── game-service/       # Pong game engine
│   └── ai-service/         # AI player logic
├── database/               # Database volumes (SQLite file location)
└── Shared_dataBase/        # Shared Prisma schema and types
```

## 🏁 Getting Started

### Prerequisites
Ensure you have the following installed on your machine:
-   **Docker**
-   **Docker Compose**
-   **Make**

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ft_transcendence.git
    cd ft_transcendence
    ```

2.  **Start the application:**
    Use the provided Makefile to build and start all services. This command will also automatically generate SSL certificates for your local IP address.
    ```bash
    make start
    ```

3.  **Access the App:**
    Once running, the terminal will display the local IP address (e.g., `https://192.168.1.X:8080`). Open this URL in your browser. Accept the self-signed certificate warning to proceed.

### Management Commands

-   **Stop the application:**
    ```bash
    make stop
    ```

-   **Restart the application:**
    ```bash
    make re
    ```

-   **Clean up:**
    Stops containers and removes all volumes (database data will be lost) and images.
    ```bash
    make prune
    ```

## 🔐 Security Note

This project uses self-signed certificates generated via `generate_cert.sh` to enable HTTPS in a development environment. Browsers will flag this as insecure; you must manually proceed/accept the risk to access the site.

## 👥 Authors

-   oualid hassani / aymen assaf / mohammed erretby / Youssef Bahij / Abdelaziz Es Sayouti

