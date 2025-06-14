'use client';

import { useState } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { TOKEN_LIST, Token, POPULAR_TOKENS } from '@/lib/tokens';
import { cn } from '@/lib/utils';

interface TokenSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  excludeToken?: Token | null;
  disabled?: boolean;
}

export default function TokenSelector({ 
  selectedToken, 
  onTokenSelect, 
  excludeToken,
  disabled = false 
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = TOKEN_LIST.filter(token => {
    if (excludeToken && token.address === excludeToken.address) return false;
    if (!searchQuery) return true;
    
    return (
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const popularTokens = filteredTokens.filter(token => 
    POPULAR_TOKENS.includes(token.address)
  );

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Token Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
          "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          !disabled && "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-blue-500"
        )}
      >
        {selectedToken ? (
          <>
            {/* Token Logo */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {selectedToken.symbol.slice(0, 2)}
              </span>
            </div>
            
            {/* Token Info */}
            <div className="flex flex-col items-start">
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedToken.symbol}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedToken.name}
              </span>
            </div>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Select token</span>
        )}
        
        {!disabled && (
          <ChevronDownIcon 
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform",
              isOpen && "transform rotate-180"
            )} 
          />
        )}
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, symbol, or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Popular Tokens */}
            {!searchQuery && popularTokens.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Popular Tokens
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {popularTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => handleTokenSelect(token)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {token.symbol.slice(0, 1)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {token.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Token List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Token Logo */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                    
                    {/* Token Info */}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {token.symbol}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {token.name}
                      </div>
                    </div>
                    
                    {/* Address */}
                    <div className="text-xs text-gray-400 font-mono">
                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tokens found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 