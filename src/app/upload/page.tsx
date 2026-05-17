"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Papa from "papaparse";
import { Sidebar } from "@/components/Sidebar";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);

  const createCampaign = useMutation(api.leads.createCampaign);
  const addProspects = useMutation(api.leads.addProspectsBatch);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !campaignName) {
      alert("Selecciona un archivo y asigna un nombre a la campaña.");
      return;
    }

    setIsUploading(true);
    setMessage("Procesando archivo...");
    setUploadedCount(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: async (results: Papa.ParseResult<Record<string, string>>) => {
        try {
          const getField = (row: any, ...keys: string[]): string => {
            for (const key of keys) {
              if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim();
              const found = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
              if (found && row[found] !== undefined && row[found] !== null) return String(row[found]).trim();
            }
            return "";
          };

          const campaignId = await createCampaign({ name: campaignName });

          const prospects = results.data.map((row: any) => ({
            name: getField(row, "Nombre", "name", "Name"),
            company: getField(row, "Empresa", "company", "Company"),
            position: getField(row, "Cargo", "position", "Position", "Puesto"),
            phone: getField(row, "Telefono", "Teléfono", "phone", "Phone", "Tel", "Celular"),
            email: getField(row, "Email", "email", "Correo", "correo") || undefined,
            linkedinUrl: getField(row, "LinkedIn", "linkedinUrl", "linkedin", "Linkedin") || undefined,
            trigger: getField(row, "Trigger", "trigger") || undefined,
          })).filter((p: { name: string; phone: string }) => p.name && p.phone);

          if (prospects.length === 0 && results.data.length > 0) {
            console.warn("⚠️ Columnas encontradas:", results.meta.fields);
          }

          await addProspects({ campaignId, prospects });
          setUploadedCount(prospects.length);

          setMessage(
            prospects.length > 0
              ? `✅ ${prospects.length} prospectos cargados en "${campaignName}"`
              : `⚠️ Campaña creada pero sin prospectos válidos. Verifica columnas "Nombre" y "Telefono".`
          );
          setCampaignName("");
          setFile(null);
        } catch (error) {
          console.error(error);
          setMessage("❌ Error al subir los datos. Revisa la consola.");
        } finally {
          setIsUploading(false);
        }
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Subir Prospectos</h1>
            <p className="text-zinc-500 text-sm mt-1">Carga un CSV para crear una nueva campaña</p>
          </div>

          {/* Upload Card */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Nombre de la Campaña
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ej: Partners HPE México Q2"
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Archivo CSV
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl p-3 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-2">
                Columnas: Nombre, Empresa, Cargo, Telefono/Celular, Email, LinkedIn, Trigger
              </p>
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading || !file || !campaignName}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${
                isUploading || !file || !campaignName
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20"
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Procesando...
                </span>
              ) : (
                "📤 Cargar Prospectos"
              )}
            </button>

            {message && (
              <div
                className={`p-4 rounded-xl text-sm font-medium text-center ${
                  message.includes("❌")
                    ? "bg-red-900/20 border border-red-800/50 text-red-300"
                    : message.includes("⚠️")
                    ? "bg-yellow-900/20 border border-yellow-800/50 text-yellow-300"
                    : "bg-green-900/20 border border-green-800/50 text-green-300"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Success info */}
          {uploadedCount > 0 && (
            <div className="mt-6 bg-blue-900/10 border border-blue-800/30 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-blue-400 mb-2">🎉 ¡Campaña creada!</h3>
              <p className="text-xs text-zinc-400 mb-3">
                {uploadedCount} prospectos listos. ¿Qué quieres hacer ahora?
              </p>
              <div className="flex gap-3">
                <a
                  href="/prospects"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-all"
                >
                  👥 Ver Prospectos
                </a>
                <a
                  href="/test-agent"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all"
                >
                  🎙️ Test Agent
                </a>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-zinc-900/30 border border-zinc-800/30 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">💡 Formato del CSV</h3>
            <ul className="text-zinc-500 text-xs space-y-1.5 list-disc list-inside">
              <li>Los headers son flexibles: <code className="text-zinc-300">Celular</code>, <code className="text-zinc-300">Telefono</code>, <code className="text-zinc-300">Phone</code> funcionan igual</li>
              <li>Incluye prefijo internacional: <code className="text-zinc-300">+52...</code></li>
              <li>Campos opcionales: Email, LinkedIn, Trigger</li>
              <li>El Trigger es contexto útil para que Javier Reus personalice la llamada</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
