import { NextRequest, NextResponse } from 'next/server'
import { GeminiContent, IGeminiContentProps, GeminiStreamContent, IGeminiStreamContentProps } from '../../gemini'

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

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
    // // @ts-ignore
    // if(typeof EdgeRuntime != `undefined`){
    //     // @ts-ignore
    //     console.log(`EdgeRuntime`, EdgeRuntime)
    // }
    const body = await request.json()
    const { parts, generationConfig, safetySettings, isStream } = body || {}

    // 流式
    if (isStream) {
        return getGeminiSSEResponse({
            parts,
            generationConfig,
            safetySettings,
        })
    }
    const modelResponse = await getGeminiResponse({
        parts,
        generationConfig,
        safetySettings,
    })
    const response = NextResponse.json({ ...modelResponse }, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
}

const getGeminiResponse = async ({ prompt, generationConfig, safetySettings, parts }: IGeminiContentProps) => {
    const modelResponse = await GeminiContent({
        prompt,
        parts,
        generationConfig,
        safetySettings,
    })

    return modelResponse
}

const getGeminiSSEResponse = ({
    prompt,
    generationConfig,
    safetySettings,
    parts,
}: Partial<IGeminiStreamContentProps>) => {
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
    GeminiStreamContent({
        prompt,
        parts,
        generationConfig,
        safetySettings,
        streamHanler: ({ token, error, status }) => {
            if (status) {
                writer.write(eventMsgHeader)
                const message = `data: ${token.replace(/\n/g, '\\n')}\n\n`
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
