"use client";

import { MaterialManager } from "../components/MaterialManager";
import { useApp } from "../providers/AppProvider";

export default function KelolaMateriPage() {
  const { savedMaterials, handleSendMaterial, handleDeleteMaterial } = useApp();

  return (
    <MaterialManager
      materials={savedMaterials}
      onSendMaterial={handleSendMaterial}
      onDeleteMaterial={handleDeleteMaterial}
    />
  );
}
