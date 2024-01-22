import { NextRequest, NextResponse } from 'next/server'
import { GeminiChat, GeminiStreamChat, IGeminiChatProps, IGeminiStreamChatProps } from '../../gemini'
import { ISafetySetting, IGenerationConfig, IChatItem } from '../../gemini/interface'
import { headers } from 'next/headers'

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

export async function GET(request: NextRequest) {
    const inputText = request.nextUrl?.searchParams?.get('inputtext') || ''
    const headersList = headers()
    const customGeminiAPIKey = headersList.get(`x-geminipro-api`) || headersList.get(`X-Geminipro-Api`)
    const modelResponse = await getGeminiResponse({
        inputText,
        customGeminiAPIKey: customGeminiAPIKey || undefined,
    })
    const response = NextResponse.json({ ...modelResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

export async function POST(request: NextRequest) {
    const headersList = headers()
    const customGeminiAPIKey = headersList.get(`x-geminipro-api`) || headersList.get(`X-Geminipro-Api`)
    const body = await request.json()
    const { history, inputText, generationConfig, safetySettings, isStream } = body || {}

    // 流式
    if (isStream) {
        return getGeminiSSEResponse({
            history,
            inputText,
            generationConfig,
            safetySettings,
            customGeminiAPIKey: customGeminiAPIKey || undefined,
        })
    }

    const modelResponse = await getGeminiResponse({
        history,
        inputText,
        generationConfig,
        safetySettings,
        customGeminiAPIKey: customGeminiAPIKey || undefined,
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
    customGeminiAPIKey,
}: IGeminiChatProps) => {
    const modelResponse = await GeminiChat({
        history,
        inputText: inputText || ``,
        generationConfig,
        safetySettings,
        customGeminiAPIKey,
    })

    return modelResponse
}

const getGeminiSSEResponse = ({
    history,
    inputText,
    generationConfig,
    safetySettings,
    customGeminiAPIKey,
}: Partial<IGeminiStreamChatProps>) => {
    // 将 SSE 数据编码为 Uint8Array
    const encoder = new TextEncoder()

    // 创建 TransformStream
    const transformStream = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk)
        },
    })

    // 创建 SSE 响应
    let response = new NextResponse(transformStream.readable)

    // 设置响应头，指定使用 SSE
    response.headers.set('Content-Type', 'text/event-stream; charset=utf-8')
    response.headers.set('Cache-Control', 'no-cache')
    response.headers.set('Connection', 'keep-alive')
    response.headers.set('Transfer-Encoding', 'chunked')

    const writer = transformStream.writable.getWriter()
    const eventMsgHeader = encoder.encode(`event: message\n`)
    const eventErrorHeader = encoder.encode(`event: error\n`)
    GeminiStreamChat({
        history,
        inputText: inputText || ``,
        generationConfig,
        safetySettings,
        customGeminiAPIKey,
        streamHanler: ({ token, error, status }) => {
            if (status) {
                writer.write(eventMsgHeader)
                const message = `data: ${token.replace(/\n/g, '\\n')}\n\n`
                // console.log(`after chunk====>`, message)
                const messageUint8Array = encoder.encode(message)
                writer.write(messageUint8Array)
            } else {
                writer.write(eventErrorHeader)
                const message = `data: ${error || ''}\n\n`
                const messageUint8Array = encoder.encode(message)
                writer.write(messageUint8Array)
            }
        },
        completeHandler: ({ content, status }) => {
            writer.write(eventMsgHeader)
            const messageUint8Array = encoder.encode('data: __completed__\n\n')
            writer.write(messageUint8Array)
        },
    })

    return response
}
