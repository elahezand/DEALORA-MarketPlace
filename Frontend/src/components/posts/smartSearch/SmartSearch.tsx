"use client";

import { useState, ChangeEvent } from "react";
import { Input, Button } from "@heroui/react";
import { PiOpenAiLogoBold } from "react-icons/pi";

interface SmartSearchProps {
  onPostSelect?: (result: any) => void;
  onSearchSubmit?: (prompt: string, budget?: number) => void;
}

export default function SmartSearch({ onPostSelect, onSearchSubmit }: SmartSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [visible, setVisible] = useState(true);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsModalOpen(false);

    if (typeof onSearchSubmit === "function") {
      onSearchSubmit(searchQuery, budget ? Number(budget) : undefined);
    }
  };

  const handleBudgetChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setBudget(value);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Open Smart Search"
        className={`fixed bottom-6 right-6 z-40 !rounded-full !w-20 !h-20 flex flex-col items-center justify-center transition-all duration-300 ease-out text-center btn-primary shadow-xl hover:scale-105 ${
          visible
            ? "opacity-100 translate-x-0 translate-y-0 scale-100"
            : "opacity-0 translate-x-16 translate-y-16 scale-95 pointer-events-none"
        }`}
      >
        <PiOpenAiLogoBold className="text-2xl text-[var(--btn-primary-text)] mb-1" />
        <span className="text-[11px] font-bold tracking-wide text-[var(--btn-primary-text)]">
          Smart Search
        </span>
      </button>

      {/* AI Prompt Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[20px] transition-opacity duration-300"
            onClick={() => !isSearching && setIsModalOpen(false)}
          />

          <div
            className="relative z-10 w-[92%] max-w-[800px] rounded-[30px] p-6 max-h-[90vh] overflow-y-auto shadow-2xl card border border-[var(--border)] text-[var(--foreground)]"
            style={{
              background: "var(--card)",
              backdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[30px] bg-[var(--gradient)]" />

            {/* Modal Header */}
            <div className="flex items-center gap-3 text-lg font-bold mb-4 border-b border-[var(--border)] pb-3 mt-1">
              <PiOpenAiLogoBold
                className="text-[var(--primary-400)] dark:text-[var(--accent-400)]"
                size={24}
              />
              <span className="tracking-tight" style={{ fontFamily: "var(--font-sans)" }}>
                AI-Powered Smart Search
              </span>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="flex flex-col gap-5">
                {/* Budget Field */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-sm tracking-tight text-[var(--label-color)]">
                      Budget
                    </label>
                    <span className="text-[var(--foreground-subtle)] font-medium text-xs">
                      (USD)
                    </span>
                  </div>
                  <Input
                    type="text"
                    value={budget}
                    onChange={handleBudgetChange}
                    placeholder="1,200.00"
                    disabled={isSearching}
                  />
                </div>

                {/* Description Field */}
                <div className="flex flex-col gap-2">
                  <label className="font-bold tracking-tight text-sm">
                    Description
                  </label>
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                    className="h-44 w-full p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-400)] transition-all resize-none text-sm"
                    placeholder="Describe what you are looking for (e.g. 'A 2-bedroom apartment near downtown with parking under $1500')..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-6 mt-4 border-t border-[var(--border)] flex justify-end gap-3">
                <Button
                  type="button"
                  onPress={() => setIsModalOpen(false)}
                  disabled={isSearching}
                  className="bg-transparent border border-[var(--border)] text-[var(--foreground)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  isLoading={isSearching}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  <span>{isSearching ? "Searching..." : "Search"}</span>
                  {!isSearching && <PiOpenAiLogoBold size={18} />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}