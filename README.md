## AI Enhanced Document QA System

# Project Overview

This repository contains the backend and frontend code for a project that integrates AI, data processing, and a modern web interface. The backend utilizes various AI-related libraries, while the frontend is built with React and Next.js. Additionally, a Python script is included for advanced data processing tasks.

## Features

- **Backend**

  - Built with Express.js.
  - Integrates LangChain and OpenAI for advanced language model capabilities.
  - Pinecone database support for vector storage and retrieval.
  - Handles file uploads using `multer` and `busboy`.
  - PDF parsing capabilities with `pdf-parse`.
  - Supports environment configuration using `dotenv`.

- **Frontend**

  - Built with Next.js.
  - Styled with Tailwind CSS.
  - Optimized for development and production environments.

- **Python Script**
  - Performs topic modeling with `LatentDirichletAllocation`.
  - Vectorization of text data using `CountVectorizer`.
  - Interacts with Pinecone for vector database operations.

---

# Getting Started

## Prerequisites

Ensure you have the following installed:

- Node.js (16.x or later)
- Python (3.8 or later)
- pip (Python package manager)
- Pinecone account (for vector database usage)
- OpenAI API key

## Installation

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure the required environment variables:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   ```
4. Start the development server:
   ```bash
   npm run start
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build project:
   ```bash
   npm run build
   ```
4. Start the development server:
   ```bash
   npm start
   ```

### Python Script

1. Open the `process_pdf_and_update_metadata.py` script file.

2. Configure the required environment variables:

```env
pc = Pinecone(api_key="YOUR_API_KEY")
```

---

# Dependencies

## Backend

- `@langchain/community`
- `@langchain/core`
- `@langchain/openai`
- `@pinecone-database/pinecone`
- `express`
- `dotenv`
- `pdf-parse`
- `multer`
- `busboy`

## Frontend

- `react`
- `react-dom`
- `next`
- `tailwindcss`
- `eslint`

## Python Script

- `scikit-learn`
- `pinecone`

---

# License

This project is licensed under the ISC License.

---

# Acknowledgments

- OpenAI for API support.
- Pinecone for vector database services.
- LangChain for language model integration.
- Community contributors for the used libraries.
