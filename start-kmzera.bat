@echo off
start cmd /k "cd backend && npm install && node index.js"
start cmd /k "cd whatsapp && npm install && node index.js"
start cmd /k "cd frontend && npm install && npm run dev"