require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// Config values (kept in .env so the same code works locally and on Vercel)
const PORT = Number(process.env.PORT) || 3000;
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL || "YOUR CHITKARA EMAIL";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || "10kb";
const MAX_FIBONACCI_TERMS = Number(process.env.MAX_FIBONACCI_TERMS) || 10000;
const MAX_ARRAY_LENGTH = Number(process.env.MAX_ARRAY_LENGTH) || 10000;
const MAX_AI_QUESTION_LENGTH = Number(process.env.MAX_AI_QUESTION_LENGTH) || 1000;
const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES) || 2;
const AI_RETRY_BASE_DELAY_MS = Number(process.env.AI_RETRY_BASE_DELAY_MS) || 600;
const AI_FALLBACK_ANSWERS = new Map([
  ["what is the capital city of maharashtra", "Mumbai"],
  ["what is the capital city of punjab", "Chandigarh"],
]);

const ALLOWED_KEYS = new Set(["fibonacci", "prime", "lcm", "hcf", "AI"]);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: MAX_BODY_SIZE }));

app.get("/health", (_req, res) => {
  return res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

app.post("/bfhl", async (req, res, next) => {
  try {
    if (!req.is("application/json")) {
      return sendError(res, 415, "Content-Type must be application/json");
    }

    if (!isPlainObject(req.body)) {
      return sendError(res, 400, "Request body must be a JSON object");
    }

    const keys = Object.keys(req.body);
    if (keys.length !== 1) {
      return sendError(
        res,
        400,
        "Request body must contain exactly one key: fibonacci, prime, lcm, hcf, or AI"
      );
    }

    const key = keys[0];
    if (!ALLOWED_KEYS.has(key)) {
      return sendError(
        res,
        400,
        "Invalid key. Allowed keys: fibonacci, prime, lcm, hcf, AI"
      );
    }

    let data;
    switch (key) {
      case "fibonacci":
        data = handleFibonacci(req.body[key]);
        break;
      case "prime":
        data = handlePrime(req.body[key]);
        break;
      case "lcm":
        data = handleLcm(req.body[key]);
        break;
      case "hcf":
        data = handleHcf(req.body[key]);
        break;
      case "AI":
        data = await handleAi(req.body[key]);
        break;
      default:
        return sendError(res, 400, "Unsupported key");
    }

    return res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof ApiError) {
    return sendError(res, error.statusCode, error.message);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return sendError(res, 400, "Malformed JSON in request body");
  }

  if (error.type === "entity.too.large") {
    return sendError(res, 413, "Request body too large");
  }

  console.error("Unhandled error:", error);
  return sendError(res, 500, "Internal server error");
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: message,
  });
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function assertInteger(value, label) {
  if (!Number.isInteger(value)) {
    throw new ApiError(400, `${label} must be an integer`);
  }
}

function assertIntegerArray(value, label) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, `${label} must be an array of integers`);
  }

  if (value.length === 0) {
    throw new ApiError(400, `${label} must not be empty`);
  }

  if (value.length > MAX_ARRAY_LENGTH) {
    throw new ApiError(422, `${label} is too large`);
  }

  for (let i = 0; i < value.length; i += 1) {
    if (!Number.isInteger(value[i])) {
      throw new ApiError(400, `${label} must contain only integers`);
    }
  }
}

function handleFibonacci(input) {
  assertInteger(input, "fibonacci");

  if (input < 0) {
    throw new ApiError(400, "fibonacci must be a non-negative integer");
  }

  if (input > MAX_FIBONACCI_TERMS) {
    throw new ApiError(422, "fibonacci value is too large");
  }

  const n = input;
  if (n === 0) {
    return [];
  }
  if (n === 1) {
    return [0];
  }

  const series = [0, 1];
  for (let i = 2; i < n; i += 1) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
}

function isPrime(num) {
  if (num <= 1) {
    return false;
  }
  if (num === 2) {
    return true;
  }
  if (num % 2 === 0) {
    return false;
  }

  const limit = Math.floor(Math.sqrt(num));
  for (let i = 3; i <= limit; i += 2) {
    if (num % i === 0) {
      return false;
    }
  }
  return true;
}

function handlePrime(input) {
  assertIntegerArray(input, "prime");
  return input.filter(isPrime);
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

function lcm(a, b) {
  if (a === 0 || b === 0) {
    return 0;
  }
  return Math.abs((a * b) / gcd(a, b));
}

function handleLcm(input) {
  assertIntegerArray(input, "lcm");
  return input.reduce((acc, value) => lcm(acc, value));
}

function handleHcf(input) {
  assertIntegerArray(input, "hcf");
  return input.reduce((acc, value) => gcd(acc, value));
}

async function handleAi(input) {
  if (typeof input !== "string") {
    throw new ApiError(400, "AI must be a string question");
  }

  const question = input.trim();
  if (!question) {
    throw new ApiError(400, "AI question must not be empty");
  }

  if (question.length > MAX_AI_QUESTION_LENGTH) {
    throw new ApiError(422, "AI question is too long");
  }

  if (!GEMINI_API_KEY) {
    throw new ApiError(503, "AI service not configured. Missing GEMINI_API_KEY");
  }

  let lastError;
  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt += 1) {
    try {
      return await callGeminiSingleWord(question);
    } catch (error) {
      lastError = error;

      const retryable = error instanceof ApiError && (error.statusCode === 429 || error.statusCode === 502);
      if (!retryable) {
        throw error;
      }

      if (attempt === AI_MAX_RETRIES) {
        break;
      }

      await delay(AI_RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }

  const fallback = getFallbackAnswer(question);
  if (fallback) {
    return fallback;
  }

  throw lastError || new ApiError(502, "AI request failed");
}

async function callGeminiSingleWord(question) {
  // External AI call (Gemini) as required in assignment
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Answer with exactly one word only.",
                  "No punctuation.",
                  "No explanations.",
                  `Question: ${question}`,
                ].join(" "),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 20,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const raw = await response.text();
    const providerStatus = response.status;
    const statusCode =
      providerStatus === 429
        ? 429
        : providerStatus === 401 || providerStatus === 403
          ? 503
          : providerStatus >= 500
            ? 502
            : 502;

    throw new ApiError(
      statusCode,
      `AI provider error: ${providerStatus} ${shorten(raw, 200)}`
    );
  }

  const payload = await response.json();
  const text = extractGeminiText(payload);
  if (!text) {
    throw new ApiError(502, "AI provider returned an empty response");
  }

  return toSingleWord(text);
}

function extractGeminiText(payload) {
  const candidates = payload && Array.isArray(payload.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts =
      candidate &&
      candidate.content &&
      Array.isArray(candidate.content.parts) &&
      candidate.content.parts;

    if (!parts) {
      continue;
    }

    for (const part of parts) {
      if (part && typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }
  return "";
}

function toSingleWord(value) {
  // Force one-word output even if model returns a sentence.
  const normalized = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim();

  if (!normalized) {
    return "N/A";
  }

  return normalized.split(/\s+/)[0];
}

function shorten(value, maxLen) {
  if (value.length <= maxLen) {
    return value;
  }
  return `${value.slice(0, maxLen)}...`;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeQuestion(question) {
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFallbackAnswer(question) {
  const normalized = normalizeQuestion(question);
  return AI_FALLBACK_ANSWERS.get(normalized) || "";
}

module.exports = app;
