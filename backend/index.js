require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.EXPRESS_SERVER_PORT || 3000;

const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { loadQAStuffChain } = require('langchain/chains');
const { Document } = require('langchain/document');
const LangchainOpenAI = require('@langchain/openai').OpenAI;
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');

const upload = require('./helpers/fileUpload');
const { spawn } = require('child_process');
const fs = require('fs');

// Middleware setup
app.use(cors());
app.use(express.json());

// Endpoint to handle PDF file uploads
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    // Load and process the uploaded PDF
    const loader = new PDFLoader('./uploads/pdfFile');
    const docs = await loader.load();

    // Split the PDF content into smaller chunks for processing
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 200,
    });
    const chunkedDocs = await textSplitter.splitDocuments(docs);

    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Initialize OpenAI embeddings client
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      batchSize: 100,
      model: 'text-embedding-3-small',
    });

    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = pc.index(indexName);

    // Prepare chunked data for embeddings
    const chunkedData = chunkedDocs.map(
      (item) => item.pageContent.replace(/[^\x00-\x7F]/g, ' ') // Remove non-ASCII characters
    );

    // Generate embeddings for the chunked data
    const dataEmbeddings = await embeddings.embedDocuments(chunkedData);
    console.log('Number of embeddings generated:', dataEmbeddings.length);

    // Create data vectors for upsert operation
    const dataVectors = dataEmbeddings.map((embedding, i) => ({
      id: chunkedData[i],
      values: embedding,
      metadata: {
        text: chunkedData[i],
      },
    }));
    index.upsert(dataVectors);

    // Perform topic modeling for each chunk using a Python script
    await Promise.all(
      chunkedData.map((item) => {
        const pythonProcess = spawn('python', [
          'process_pdf_and_update_metadata.py', // Python script name
          indexName,
          item, // Chunked data
        ]);

        pythonProcess.stdout.on('data', (data) => {
          console.log(`Python output: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
          console.error(`Python error: ${data}`);
        });
      })
    );

    // Remove the uploaded file after processing
    fs.unlinkSync('./uploads/pdfFile');

    // Send success response to the client
    res.json({
      message: 'Upload and topic modeling completed successfully.',
    });
  } catch (err) {
    console.error('Error during file upload and processing:', err);
    res.status(500).json({ error: 'Failed to process the uploaded file.' });
  }
});

// Endpoint to handle question-answering
app.post('/ask', async (req, res) => {
  try {
    const question = req.body.question;

    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const indexName = process.env.PINECONE_INDEX_NAME;
    const index = pc.index(indexName);

    // Generate query embedding for the question
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);

    // Query Pinecone for the most relevant chunks
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // Concatenate the relevant chunks for further processing
    const concatenatedText = queryResponse.matches
      .map((match) => match.metadata.text)
      .join(' ');

    // Use OpenAI to generate an answer from the relevant chunks
    const llm = new LangchainOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const chain = loadQAStuffChain(llm);
    const result = await chain.invoke({
      input_documents: [new Document({ pageContent: concatenatedText })],
      question: question,
    });

    // Return the answer and relevant chunks
    res
      .status(200)
      .json({ answer: result.text, relevantChunks: queryResponse });
  } catch (e) {
    console.error('Error during Q&A process:', e);
    res.status(404).json({ error: e.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
