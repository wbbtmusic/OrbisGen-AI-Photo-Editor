/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">
          Add Custom API Key
        </h2>
        <div className="text-sm sm:text-base text-zinc-300 space-y-4 my-6">
            <p>
                It looks like you're running this app outside of AI Studio. To use the generative features, you'll need to provide your own Google Gemini API key.
            </p>
             <div className="text-left text-xs bg-zinc-800/50 p-4 rounded-lg space-y-2">
                <p className="font-semibold">How to get your API Key:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Google AI Studio</a>.</li>
                    <li>Click on the "Get API key" button.</li>
                    <li>Create a new API key in a project.</li>
                    <li>Copy the key and paste it below.</li>
                </ol>
             </div>
             <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Gemini API key here"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-3 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
             />
        </div>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 text-base rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
        >
          Save & Continue
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ApiKeyModal;