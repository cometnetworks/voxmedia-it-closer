import { NextRequest, NextResponse } from "next/server";
import { JAVIER_REUS_PROMPT } from "@/agents/prompts/theCloser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, prospectName, prospectCompany, prospectPosition, prospectTrigger } = body;

    const targetPhone = phoneNumber || process.env.TEST_PHONE_NUMBER;
    const vapiKey = process.env.VAPI_PRIVATE_KEY;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

    if (!vapiKey) {
      return NextResponse.json({ error: "VAPI_PRIVATE_KEY no configurada" }, { status: 500 });
    }

    if (!targetPhone) {
      return NextResponse.json({ error: "No se proporcionó número de teléfono" }, { status: 400 });
    }

    const name = prospectName || "Prospecto";
    const company = prospectCompany || "tu empresa";
    const position = prospectPosition || "";
    const trigger = prospectTrigger || "su trabajo en el sector de tecnología";

    const callPayload: any = {
      customer: {
        number: targetPhone,
        name: name,
      },
      assistant: {
        name: "Javier Reus - IT Closer",
        firstMessage: `Hola ${name}, ¿qué tal? Habla Javier Reus de Vox Media Agency. Estuve revisando el perfil de ${company} y me llamó la atención ${trigger}. ¿Tienes un par de minutos?`,
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `${JAVIER_REUS_PROMPT}\n\nDATOS DEL PROSPECTO:\nNombre: ${name}\nEmpresa: ${company}\nCargo: ${position}\nContexto: ${trigger}`,
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: process.env.ELEVENLABS_VOICE_ID || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "VR6AewLTigWG4xSOukaG",
          model: "eleven_multilingual_v2",
        },
      },
    };

    if (phoneNumberId) {
      callPayload.phoneNumberId = phoneNumberId;
    }

    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.endedMessage || "Error al iniciar llamada", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      callId: data.id,
      message: `Llamada iniciada a ${name} (${targetPhone})`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
  }
}
