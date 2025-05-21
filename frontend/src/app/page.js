'use client'; // Enables client-side rendering
import React, { useEffect, useState } from 'react';

// Define the backend URL for API requests
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export default function Home() {
  // State variables to manage user interactions, responses, and UI state
  const [question, setQuestion] = useState('');
  const [answers] = useState([]); // Stores the conversation history
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const [modalOpen, setModalOpen] = useState(false); // Controls the visibility of the modal
  const [relevantChunks, setRelevantChunks] = useState([]); // Stores relevant document chunks for modal display

  // Handles file upload and sends it to the backend
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('pdfFile', file);

    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.log(`Response status: ${response.status}`); // Log an error if the upload fails
    }
  };

  // Updates the state when the question input changes
  const handleQuestionChange = async (e) => {
    setQuestion(e.target.value);
  };

  // Sends the question to the backend and retrieves an answer
  const handleAskQuestion = async () => {
    // Add the user's question to the conversation
    answers.push({ role: 'user', text: question });
    setIsLoading(true); // Show loading indicator during API call

    const response = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: question }),
    });

    setQuestion(''); // Clear the question input field

    if (!response.ok) {
      console.log(`Response status: ${response.status}`); // Log an error if the API call fails
    }

    // Parse the API response and update the conversation with the AI's answer
    const json = await response.json();
    answers.push({
      role: 'ai',
      text: json.answer,
      relevantChunks: json.relevantChunks.matches, // Store relevant chunks for later reference
    });

    setIsLoading(false); // Hide the loading indicator
  };

  // Displays relevant document chunks in a modal
  const handleShowRelevantChunks = async (index) => {
    setRelevantChunks(answers[index].relevantChunks);
    setModalOpen(true);
  };

  // Adds keyboard functionality to submit the question with the "Enter" key
  useEffect(() => {
    const input = document.getElementById('questionInput');

    input.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission
        document.getElementById('askQuestionButton').click(); // Trigger the "Ask" button click
      }
    });
  }, []);

  return (
    <div>
      <main>
        <div className='flex flex-col h-screen bg-gray-800'>
          {/* Header */}
          <header className='bg-gray-700 shadow-md py-4 px-6'>
            <h1 className='text-xl md:text-2xl font-semibold text-gray-100'>
              AI-Enhanced Document QA System
            </h1>
          </header>

          {/* Main content area */}
          <div className='flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto'>
            {/* Display conversation history */}
            {answers.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.role === 'user' ? 'justify-end' : 'justify-start'
                } ${index === answers.length - 1 ? 'mb-4' : ''}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 shadow-md ${
                    item.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-600 text-gray-100'
                  }`}
                >
                  <p className='text-sm md:text-base'>{item.text}</p>
                  {item.role === 'ai' && (
                    <button
                      onClick={() => handleShowRelevantChunks(index)}
                      className='mt-2 text-xs sm:text-sm text-teal-300 hover:text-teal-100'
                    >
                      Show Relevant Chunks
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading spinner */}
            {isLoading && (
              <div className='flex justify-start'>
                <div className='bg-gray-600 text-gray-100 max-w-[80%] rounded-lg p-4 shadow-md'>
                  <svg
                    className='animate-spin h-5 w-5 text-teal-400'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Input form */}
          <div className='border-t border-gray-600 bg-gray-700 p-4'>
            <form className='flex flex-col sm:flex-row items-center gap-3'>
              {/* File upload button */}
              <input
                type='file'
                name='pdfFile'
                onChange={(e) => handlePdfUpload(e)}
                className='hidden'
                accept='application/pdf'
                id='file-upload'
              />
              <button
                type='button'
                onClick={() => document.getElementById('file-upload')?.click()}
                className='text-gray-300 hover:text-gray-100 hover:bg-gray-600 border border-gray-500 rounded-md w-12 h-12 flex-shrink-0 flex items-center justify-center'
              >
                {/* Upload icon */}
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-6 h-6'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13'
                  />
                </svg>
              </button>

              {/* Question input */}
              <textarea
                id='questionInput'
                value={question}
                onChange={(e) => handleQuestionChange(e)}
                placeholder='Ask me a question...'
                className='w-full sm:flex-grow bg-gray-600 border border-gray-500 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-100 placeholder-gray-400 p-2 h-[48px] resize-none'
              />

              {/* Ask question button */}
              <button
                type='button'
                id='askQuestionButton'
                onClick={handleAskQuestion}
                className='bg-teal-600 hover:bg-teal-700 text-white rounded-md w-12 h-12 flex-shrink-0 flex items-center justify-center'
              >
                {/* Send icon */}
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-6 h-6'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5'
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Modal for relevant chunks */}
          {modalOpen && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4'>
              <div className='bg-gray-700 rounded-lg p-6 max-w-4xl w-full'>
                <h2 className='text-xl font-bold text-gray-100 mb-4'>
                  Relevant Chunks and Scores
                </h2>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left border-collapse'>
                    <thead>
                      <tr>
                        <th className='py-2 px-4 bg-gray-600 font-semibold text-gray-200 border-b border-gray-500'>
                          Relevant Chunk
                        </th>
                        <th className='py-2 px-4 bg-gray-600 font-semibold text-gray-200 border-b border-gray-500'>
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {relevantChunks.map((chunk, index) => (
                        <tr key={index} className='hover:bg-gray-600'>
                          <td className='py-2 px-4 border-b border-gray-500 text-gray-300'>
                            {chunk.metadata.text}
                          </td>
                          <td className='py-2 px-4 border-b border-gray-500 text-gray-300'>
                            {chunk.score.toFixed(5)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className='mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md px-4 py-2'
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
