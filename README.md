# Real-Time Chatting App

A modern real-time chat application built with Node.js and Socket.io, featuring secure authentication and persistent data storage.

## Overview

This is a full-featured real-time messaging application that allows users to communicate instantly with each other. The application uses WebSocket technology to enable live message delivery and includes user authentication with JWT tokens and password encryption.

## Features

- **Real-Time Messaging**: Instant message delivery using Socket.io WebSocket connections
- **User Authentication**: Secure login system with JWT tokens and bcrypt password hashing
- **User Management**: User registration and session management
- **Cookie-Based Sessions**: Persistent user sessions with cookie-parser
- **Database Integration**: Prisma ORM for reliable data persistence
- **Modern Stack**: ES6+ JavaScript with Node.js

## Tech Stack

### Backend
- **Framework**: Express.js 5.2.1
- **Real-Time**: Socket.io 4.8.3
- **Database ORM**: Prisma 6.19.2
- **Authentication**: 
  - JWT (jsonwebtoken 9.0.3)
  - bcrypt 6.0.0
- **Session Management**: cookie-parser 1.4.7

### Development
- **Runtime**: Node.js with ES6 modules
- **Package Manager**: npm

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rotten120/real-time-chatting-app.git
   cd real-time-chatting-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate Prisma client**
   ```bash
   npm run db:gen
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

## Usage

### Development Server
Start the development server with auto-reload:
```bash
npm run dev
```
The server will start and watch for file changes.

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run db:gen` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm test` - Run tests (not yet implemented)

## Project Structure

```
real-time-chatting-app/
├── src/              # Source code
│   └── server.js     # Main server entry point
├── prisma/           # Database schema and migrations
├── public/           # Static files
├── package.json      # Project dependencies and scripts
├── prisma.config.ts  # Prisma configuration
└── .gitignore        # Git ignore rules
```

## Getting Started

1. Make sure you have Node.js installed
2. Follow the Installation steps above
3. Start the development server with `npm run dev`
4. The application will be running and ready to accept connections

## License

ISC