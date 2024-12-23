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

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    const loader = new PDFLoader('./uploads/pdfFile');
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);

    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      batchSize: 100,
      model: 'text-embedding-3-small',
    });

    const indexName = 'openai-enhanced-qa-system';

    const index = pc.index(indexName);
    const chunkedData = chunkedDocs.map((item) =>
      item.pageContent.replace(/[^\x00-\x7F]/g, ' ')
    );

    const dataEmbeddings = await embeddings.embedDocuments(chunkedData);

    console.log('length of embeddings: ' + dataEmbeddings.length);

    const dataVectors = dataEmbeddings.map((embedding, i) => ({
      id: chunkedData[i],
      values: embedding,
      metadata: {
        text: chunkedData[i],
      },
    }));
    index.upsert(dataVectors);

    await Promise.all(
      chunkedData.map((item) => {
        // Python scriptini çalıştırma ve topic modelling yapma
        const pythonProcess = spawn('python', [
          'process_pdf_and_update_metadata.py', // Python scriptinizin adı
          indexName,
          item,
        ]);

        pythonProcess.stdout.on('data', (data) => {
          console.log(`Python stdout: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
          console.error(`Python error: ${data}`);
        });
      })
    );
    fs.unlinkSync('./uploads/pdfFile');
    // İstemciye başarı mesajı dön
    res.json({
      message: 'Upload and topic modelling completed successfully.',
    });
  } catch (err) {
    console.error('Error processing upload:', err);
    res.status(500).json({ error: 'Failed to process upload.' });
  }
});

app.post('/ask', async (req, res) => {
  try {
    const question = req.body.question;
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const indexName = 'openai-enhanced-qa-system';

    const index = pc.index(indexName);

    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);

    let queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    const concatenatedText = queryResponse.matches
      .map((match) => match.metadata.text)
      .join(' ');

    const llm = new LangchainOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const chain = loadQAStuffChain(llm);

    const result = await chain.invoke({
      input_documents: [new Document({ pageContent: concatenatedText })],
      question: question,
    });

    return res.status(200).json({ answer: result.text, relevantChunks: queryResponse });
  } catch (e) {
    return res.status(404).json({ error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
