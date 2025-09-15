/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { motion } from 'framer-motion';

interface DisclaimerModalProps {
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
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
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          User Responsibility Agreement
        </h2>
        <div className="text-sm sm:text-base text-zinc-300 space-y-4 my-6">
          <p>
            Welcome to OrbisGen. Before you begin, please acknowledge the following:
          </p>
          <ul className="list-disc list-inside text-left space-y-2 bg-zinc-800/50 p-4 rounded-lg">
            <li>
              You are <strong>solely responsible</strong> for the content you create and share using this application.
            </li>
            <li>
              You agree not to use OrbisGen for any unlawful purpose, including creating content that is defamatory, hateful, or infringing on copyright, privacy, or publicity rights.
            </li>
            <li>
              Any misuse of this tool that violates laws or the rights of others is <strong>strictly your own liability.</strong>
            </li>
          </ul>
          <p className="font-semibold text-zinc-200 pt-2">
            By clicking "Agree & Continue", you confirm that you have read, understood, and accepted these terms.
          </p>
        </div>
        <button
          onClick={onAccept}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 text-base rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700"
        >
          Agree & Continue
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DisclaimerModal;