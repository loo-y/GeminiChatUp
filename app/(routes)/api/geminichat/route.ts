import { NextRequest, NextResponse } from 'next/server'
import { GeminiChat } from '../../gemini'
import { ISafetySetting, IGenerationConfig, IChatItem } from '../../gemini/interface'
export async function GET(request: NextRequest) {
    const inputText = request.nextUrl?.searchParams?.get('inputtext') || ''
    const modelResponse = await getGeminiResponse({
        inputText,
    })
    const response = NextResponse.json({ ...modelResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { history, inputText, generationConfig, safetySettings } = body || {}

    const modelResponse = await getGeminiResponse({
        history,
        inputText,
        generationConfig,
        safetySettings,
    })
    const response = NextResponse.json({ ...modelResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

const getGeminiResponse = async ({
    history,
    inputText,
    generationConfig,
    safetySettings,
}: {
    history?: IChatItem[]
    inputText?: string
    generationConfig?: IGenerationConfig
    safetySettings?: ISafetySetting[]
}) => {
    const modelResponse = await GeminiChat({
        history,
        inputText: inputText || ``,
        generationConfig,
        safetySettings,
    })

    return modelResponse
}
