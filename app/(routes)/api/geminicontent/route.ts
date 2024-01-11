import { NextRequest, NextResponse } from 'next/server'
import { GeminiContent } from '../../gemini'
import { ISafetySetting, IGenerationConfig, IChatItem } from '../../gemini/interface'
import { Part } from '@google/generative-ai'
export async function GET(request: NextRequest) {
    const prompt = request.nextUrl?.searchParams?.get('prompt') || ''
    const modelResponse = await getGeminiResponse({
        prompt,
    })
    const response = NextResponse.json({ ...modelResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { parts, generationConfig, safetySettings } = body || {}

    const modelResponse = await getGeminiResponse({
        parts,
        generationConfig,
        safetySettings,
    })
    const response = NextResponse.json({ ...modelResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

const getGeminiResponse = async ({
    prompt,
    generationConfig,
    safetySettings,
    parts,
}: {
    prompt?: string
    generationConfig?: IGenerationConfig
    safetySettings?: ISafetySetting[]
    parts?: Part[]
}) => {
    const modelResponse = await GeminiContent({
        prompt,
        parts,
        generationConfig,
        safetySettings,
    })

    return modelResponse
}
