'use client';

import { TransactionExplorer } from '@/components/playground/TransactionExplorer';

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Contract Interaction Explorer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View, search, and analyze your contract interactions and transaction history
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <TransactionExplorer />
        </div>
      </div>
    </div>
  );
}
