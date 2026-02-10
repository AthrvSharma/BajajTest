# Chitkara Qualifier 1 - BFHL API Submission

This is my submission for the Qualifier assignment.

Required APIs implemented:
- `GET /health`
- `POST /bfhl`

## Tech Stack
- Node.js
- Express.js
- Google Gemini API (for `AI` key)

## Project Structure
- `index.js` -> main API logic
- `api/health.js` and `api/bfhl.js` -> Vercel serverless entry files
- `vercel.json` -> route mapping for Vercel deployment
- `.env.example` -> sample env variables

## Environment Variables
Create `.env` and add:

```env
PORT=3000
OFFICIAL_EMAIL=your_rollno-be23@chitkara.edu.in
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
MAX_BODY_SIZE=10kb
MAX_FIBONACCI_TERMS=10000
MAX_ARRAY_LENGTH=10000
MAX_AI_QUESTION_LENGTH=1000
```

## Run Locally
```bash
npm install
npm start
```

Server runs on: `http://localhost:3000`

## API Contract

### 1) `GET /health`
Response:
```json
{
  "is_success": true,
  "official_email": "your_rollno-be23@chitkara.edu.in"
}
```

### 2) `POST /bfhl`
Body must contain exactly one key from:
- `fibonacci`
- `prime`
- `lcm`
- `hcf`
- `AI`

Success format:
```json
{
  "is_success": true,
  "official_email": "your_rollno-be23@chitkara.edu.in",
  "data": "..."
}
```

Error format:
```json
{
  "is_success": false,
  "official_email": "your_rollno-be23@chitkara.edu.in",
  "error": "..."
}
```

## Local Test Commands
```bash
curl -s http://localhost:3000/health

curl -s -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"fibonacci":7}'

curl -s -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"prime":[2,4,7,9,11]}'

curl -s -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"lcm":[12,18,24]}'

curl -s -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"hcf":[24,36,60]}'

curl -s -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"AI":"What is the capital city of Maharashtra?"}'
```
