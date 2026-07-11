"use client";

import { useState } from "react";
import { QuestionBankManager } from "../components/QuestionBankManager";
import { MaterialStats } from "../components/MaterialStats";
import { QuotesManager } from "../components/QuotesManager";
import { useApp } from "../providers/AppProvider";
import type { Zona } from "@/lib/types";

export default function BankSoalPage() {
  const [zonaList, setZonaList] = useState<Zona[]>([]);
  
  const {
    savedMaterials,
    quotes,
    handleSaveMaterial,
    handleAddQuote,
    handleRemoveQuote,
  } = useApp();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 max-w-[1600px] mx-auto mb-4">
      {/* Left - Question Bank Manager */}
      <QuestionBankManager
        onSaveMaterial={handleSaveMaterial}
        quotes={quotes}
        onZonaChange={setZonaList}
      />

      {/* Right - Stats and Quotes */}
      <div className="space-y-3 sm:space-y-4">
        <MaterialStats materials={savedMaterials} />
        <QuotesManager
          quotes={quotes}
          zonaList={zonaList}
          onAddQuote={handleAddQuote}
          onRemoveQuote={handleRemoveQuote}
        />
      </div>
    </div>
  );
}
