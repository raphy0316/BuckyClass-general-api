# Grow - Backend API Server

Grow is a course-based social platform that enables students to view academic info, write reviews, and engage in real-time chat.  
This backend is built with **Next.js API Routes**, using **Firebase Authentication**, **Firebase Realtime Database**, and **PostgreSQL** with **Prisma ORM**.

## Tech Stack
- Next.js (API Routes) + TypeScript
- PostgreSQL
- Firebase Admin SDK (Auth, Realtime DB)
- Axios

## Core Features
- Auth & Authorization (Firebase ID Token)
- Course Info API (from Madgrades)
- Review CRUD API
- Chatroom metadata API (Firebase-linked)
- User Profile & Enrollment API

## Auth Flow
Clients send Firebase ID Token via header:  
Authorization: Bearer <token>  
Server verifies and extracts UID, email, isAdmin

## Database Schema (Prisma)
https://dbdiagram.io/d/6813d84f1ca52373f5228e49

## Madgrades Sync
- Sync script: admin/courses/update/route.ts  
- Processes thousands of rows using chunked, transactional inserts  
- Only retains most recent 5 years of data  

## Getting Started
1. Install dependencies  
   npm install

2. Set environment variables in `.env`  
   DATABASE_URL=...  
   FIREBASE_PROJECT_ID=...  
   FIREBASE_CLIENT_EMAIL=...  
   FIREBASE_PRIVATE_KEY=...

3. Start dev server  
   npm run dev

## Endpoints
https://plume-trouser-a64.notion.site/API-197fa6de67e3804eb1c5eb42a5f2da4f?pvs=4

## Admin Capabilities
- Manage Course Chatting room
- Update data from Madgrade API 

## Real-time Chat
- Real-time messages handled in Firebase Realtime Database  
- Backend manages only course chat metadata.

## Developer
Backend: Hyuntaek Oh, Chaerin Yoo, Youngjun Jung  
Frontend: https://github.com/raphy0316/BuckyClass-mobile-ReactNative


