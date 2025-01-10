# EchoTrade

## Setup
Prerequisites:
- Python 3.10 - 3.12
- Node.js 18+
- PostgreSQL 15+
- Docker

1. Create a .env file in echotrade
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/DB?schema=public"
URL="http://localhost:3000"
```
2. Run the setup script
```
cd setup
./setup.sh or ./setup.bat
```

3. Install node dependencies
```
cd echotrade
npm install
```

4. Generate the database schema
```
cd echotrade
npx prisma generate
```

5. Run the development server
```
cd echotrade
npm run dev
```