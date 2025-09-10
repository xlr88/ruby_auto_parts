# RAP - Ruby Auto Parts

## Quick start (local)

### Backend
1. cd server
2. cp .env.example .env and fill values (MONGO_URI, CLOUDINARY keys, JWT_SECRET)
3. npm install
4. npm run dev

### Frontend
1. cd client
2. npm install
3. create .env (optional) with REACT_APP_API_URL=http://localhost:5000/api
4. npm start

Login using seeded accounts in server/.env (ADMIN1_EMAIL, ADMIN1_PASS, etc).
