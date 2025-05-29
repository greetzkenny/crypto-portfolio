import React from 'react';

const Portfolio: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Portfolio Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your cryptocurrency holdings here.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Add, edit, or remove crypto assets from your portfolio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio; 