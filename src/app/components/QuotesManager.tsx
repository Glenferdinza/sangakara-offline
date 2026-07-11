"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Quote, Plus, X } from "lucide-react";

interface QuotesManagerProps {
  quotes: string[];
  zonaList: Array<{ id: string; nama: string }>;
  onAddQuote: (quote: string) => void;
  onRemoveQuote: (index: number) => void;
}

export function QuotesManager({ quotes, zonaList, onAddQuote, onRemoveQuote }: QuotesManagerProps) {
  const [currentQuote, setCurrentQuote] = useState("");
  const [selectedZona, setSelectedZona] = useState<string>("global");

  const handleAddQuote = () => {
    if (currentQuote.trim()) {
      const finalQuote = selectedZona === "global" 
        ? currentQuote.trim() 
        : `[${selectedZona}] ${currentQuote.trim()}`;
      onAddQuote(finalQuote);
      setCurrentQuote("");
      setSelectedZona("global");
    }
  };

  // Helper to parse quote for display
  const parseQuote = (q: string) => {
    if (q.startsWith("[") && q.includes("]")) {
      const idx = q.indexOf("]");
      const zId = q.substring(1, idx);
      const text = q.substring(idx + 1).trim();
      const zona = zonaList.find(z => z.id === zId);
      return { text, zonaNama: zona ? zona.nama : "Zona Unknown", isGlobal: false };
    }
    return { text: q, zonaNama: "Semua Zona (Global)", isGlobal: true };
  };

  return (
    <Card className="border-gray-200 shadow-md">
      <CardHeader className="bg-[#1E3A5F] text-white p-2.5 sm:p-3">
        <CardTitle className="text-xs sm:text-sm font-bold">
          Kelola Quotes Motivasi
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3">
        <p className="text-xs text-gray-600">
          Quotes akan muncul saat remaja binaan berhenti di nomor yang tidak mendapat soal.
        </p>

        {/* Input Quote Baru */}
        <div className="space-y-2">
          <Label htmlFor="newQuote" className="text-[#2D3748] font-medium text-xs">
            Tambah Quote Baru
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedZona}
              onChange={(e) => setSelectedZona(e.target.value)}
              className="flex h-9 w-full sm:w-1/3 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
            >
              <option value="global">Semua Zona (Global)</option>
              {zonaList.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nama}
                </option>
              ))}
            </select>
            <Textarea
              id="newQuote"
              placeholder="Masukkan kutipan motivasi..."
              value={currentQuote}
              onChange={(e) => setCurrentQuote(e.target.value)}
              rows={1}
              className="border-gray-300 focus:border-[#F5A623] focus:ring-[#F5A623]/20 resize-none text-xs flex-1 min-h-[36px]"
            />
            <Button
              onClick={handleAddQuote}
              className="bg-[#F5A623] hover:bg-[#E69500] text-white h-auto px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Daftar Quotes */}
        {quotes.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-[#2D3748] font-medium text-xs">
              Daftar Quotes ({quotes.length})
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {quotes.map((quote, idx) => {
                const parsed = parseQuote(quote);
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                      <Quote className="w-3.5 h-3.5 text-[#F5A623] flex-shrink-0" />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${parsed.isGlobal ? "bg-gray-200 text-gray-700" : "bg-[#1E3A5F] text-white"}`}>
                        {parsed.zonaNama}
                      </span>
                    </div>
                    <div className="flex-1 flex items-start gap-2 w-full">
                      <p className="flex-1 text-xs text-gray-700 italic">"{parsed.text}"</p>
                      <button
                        onClick={() => onRemoveQuote(idx)}
                        className="flex-shrink-0 p-1 hover:bg-amber-200 rounded transition mt-[-2px]"
                      >
                        <X className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
            <Quote className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Belum ada quotes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
