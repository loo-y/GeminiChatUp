import { NextRequest, NextResponse } from 'next/server'
import { GeminiTokenCount } from '../../gemini'
import { IGeminiTokenCountProps } from '../../gemini/interface'
export async function GET(request: NextRequest) {
    const prompt = request.nextUrl?.searchParams?.get('prompt') || ''
    const countResponse = await getGeminiTokenCount({
        prompt,
    })
    const response = NextResponse.json({ ...countResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { history, prompt, parts, limit } = body || {}

    const countResponse = await getGeminiTokenCount({
        history,
        prompt,
        parts,
        limit,
    })
    const response = NextResponse.json({ ...countResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

const getGeminiTokenCount = async (geminiTokenCountProps: IGeminiTokenCountProps) => {
    const countResult = await GeminiTokenCount(geminiTokenCountProps)
    return countResult
}
