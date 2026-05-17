"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Conversation } from "@elevenlabs/client";
import { Sidebar } from "@/components/Sidebar";
import { JAVIER_REUS_PROMPT } from "@/agents/prompts/theCloser";

type CallStatus = "idle" | "connecting" | "active" | "ended";

interface TranscriptEntry {
  role: "assistant" | "user";
  text: string;
  timestamp: Date;
}

export default function TestAgentPage() {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Datos del prospecto de prueba
  const [prospectName, setProspectName] = useState("Adán López");
  const [prospectCompany, setProspectCompany] = useState("Nemaris");
  const [prospectPosition, setProspectPosition] = useState("Director de Operaciones");
  const [prospectTrigger, setProspectTrigger] = useState("Renovación de infraestructura SOC");

  const conversationRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll del transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Timer de duración
  useEffect(() => {
    if (callStatus === "active") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startCall = useCallback(async () => {
    setError("");
    setTranscript([]);
    setCallStatus("connecting");

    try {
      // Usar la API nativa de ElevenLabs
      const agentId = "agent_9601kkk4cg7sepdvbfd8606dy8vn"; 

      // Obtener signed url del backend (esto evita que ElevenLabs rechace la conexión por origen/CORS)
      const res = await fetch(`/api/get-signed-url?agent_id=${agentId}`);
      if (!res.ok) {
        throw new Error("No se pudo obtener el token de conexión para el agente (WebSocket falló).");
      }
      const data = await res.json();

      // Pedir permisos de micrófono primero
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket", // Forzar WebSocket para evitar bloqueos en localhost
        overrides: {
          agent: {
            prompt: {
              dynamicVariables: {
                nombre: prospectName || "Cliente"
              }
            }
          }
        },
        onConnect: () => {
          setCallStatus("active");
          console.log("🟢 Llamada iniciada con ElevenLabs (Ailed)");
        },
        onDisconnect: (reason?: any) => {
          setCallStatus("ended");
          setIsSpeaking(false);
          console.log("🔴 Llamada terminada. Razón de desconexión:", reason);
        },
        onMessage: (message: any) => {
          console.log("📨 Mensaje recibido:", message);
          if (message.source === "ai" || message.source === "user") {
            setTranscript((prev) => [
              ...prev,
              {
                role: message.source === "ai" ? "assistant" : "user",
                text: message.message,
                timestamp: new Date(),
              },
            ]);
          }
        },
        onError: (e: any) => {
          console.error("❌ Error CRÍTICO de ElevenLabs:", e);
          setError(typeof e === "string" ? e : e?.message || JSON.stringify(e) || "Error en la llamada con ElevenLabs");
          setCallStatus("idle");
        },
        onModeChange: (mode: any) => {
          if (mode.mode === "speaking") setIsSpeaking(true);
          if (mode.mode === "listening") setIsSpeaking(false);
        }
      });

      conversationRef.current = conversation;

    } catch (err: any) {
      console.error("Error al iniciar:", err);
      setError(err?.message || "No se pudo iniciar la llamada. Revisa permisos de micrófono.");
      setCallStatus("idle");
    }
  }, [prospectName, prospectCompany, prospectPosition, prospectTrigger]);

  const endCall = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
    }
    setCallStatus("ended");
  }, []);

  const toggleMute = useCallback(async () => {
    const newMuted = !isMuted;
    if (conversationRef.current && typeof conversationRef.current.setVolume === 'function') {
      await conversationRef.current.setVolume(newMuted ? { volume: 0 } : { volume: 1 });
    }
    setIsMuted(newMuted);
  }, [isMuted]);

  const resetCall = useCallback(() => {
    setCallStatus("idle");
    setTranscript([]);
    setError("");
    setCallDuration(0);
    setVolumeLevel(0);
    setIsSpeaking(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎙️ Test — Ailed
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Habla con el agente IA directamente desde tu navegador</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Datos del prospecto */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                Datos del Prospecto
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Nombre", value: prospectName, setter: setProspectName },
                  { label: "Empresa", value: prospectCompany, setter: setProspectCompany },
                  { label: "Cargo", value: prospectPosition, setter: setProspectPosition },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="block text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      disabled={callStatus === "active" || callStatus === "connecting"}
                      className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Trigger / Contexto</label>
                  <textarea
                    value={prospectTrigger}
                    onChange={(e) => setProspectTrigger(e.target.value)}
                    disabled={callStatus === "active" || callStatus === "connecting"}
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Estado */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Estado</h2>
              <div className="space-y-2 text-sm">
                {[
                  {
                    label: "Conexión",
                    value: callStatus === "active" ? "🟢 Activa" : callStatus === "connecting" ? "🟡 Conectando..." : callStatus === "ended" ? "🔴 Terminada" : "⚪ Inactiva",
                    color: callStatus === "active" ? "text-green-400" : callStatus === "connecting" ? "text-yellow-400" : callStatus === "ended" ? "text-red-400" : "text-zinc-600",
                  },
                  { label: "Duración", value: formatDuration(callDuration), color: "text-white font-mono" },
                  { label: "Agente", value: isSpeaking ? "🗣️ Hablando" : "🔇 Escuchando", color: isSpeaking ? "text-blue-400" : "text-zinc-600" },
                  { label: "Micrófono", value: isMuted ? "🔇 Silenciado" : "🎤 Activo", color: isMuted ? "text-red-400" : "text-green-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-zinc-500">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </div>

              {callStatus === "active" && (
                <div className="mt-4">
                  <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider">Volumen</div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(volumeLevel * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="lg:col-span-2 space-y-4">
            {/* Controles */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-4">
                {callStatus === "idle" || callStatus === "ended" ? (
                  <>
                    <button
                      onClick={callStatus === "ended" ? resetCall : startCall}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-900/30"
                    >
                      {callStatus === "ended" ? "🔄 Nueva Llamada" : "📞 Iniciar Llamada"}
                    </button>
                    {callStatus === "ended" && transcript.length > 0 && (
                      <button
                        onClick={startCall}
                        className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all"
                      >
                        📞 Llamar de Nuevo
                      </button>
                    )}
                  </>
                ) : callStatus === "connecting" ? (
                  <div className="flex items-center gap-3 text-yellow-400">
                    <div className="animate-spin h-6 w-6 border-2 border-yellow-400 border-t-transparent rounded-full" />
                    <span className="font-bold text-lg">Conectando con Ailed...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`px-6 py-4 rounded-2xl font-bold transition-all ${
                        isMuted
                          ? "bg-red-600/20 border-2 border-red-500 text-red-400"
                          : "bg-zinc-800 border-2 border-zinc-700 text-white hover:bg-zinc-700"
                      }`}
                    >
                      {isMuted ? "🔇 Silenciado" : "🎤 Micrófono"}
                    </button>
                    <button
                      onClick={endCall}
                      className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-red-900/30"
                    >
                      ✖ Colgar
                    </button>
                  </>
                )}
              </div>

              {/* Wave visualizer */}
              {callStatus === "active" && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.max(4, isSpeaking ? Math.random() * volumeLevel * 60 : 4)}px`,
                        opacity: isSpeaking ? 0.8 : 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-4 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Transcript */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                📝 Transcripción en Vivo
              </h2>
              <div className="h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {transcript.length === 0 ? (
                  <p className="text-zinc-600 text-center py-8 text-sm">
                    {callStatus === "idle"
                      ? "Inicia una llamada para ver la transcripción..."
                      : callStatus === "connecting"
                      ? "Conectando con Ailed..."
                      : "La transcripción aparecerá aquí..."}
                  </p>
                ) : (
                  transcript.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${entry.role === "assistant" ? "" : "flex-row-reverse"}`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          entry.role === "assistant"
                            ? "bg-blue-600/20 text-blue-400"
                            : "bg-purple-600/20 text-purple-400"
                        }`}
                      >
                        {entry.role === "assistant" ? "🤖" : "👤"}
                      </div>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          entry.role === "assistant"
                            ? "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                            : "bg-blue-600/20 text-blue-100 rounded-tr-sm"
                        }`}
                      >
                        {entry.text}
                        <div className="text-[10px] text-zinc-600 mt-1">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
