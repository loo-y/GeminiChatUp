import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import _ from 'lodash'
import { ISafetySetting, IGenerationConfig, IChatItem, IGeminiTokenCountProps } from './interface'
import * as dotenv from 'dotenv'
dotenv.config()

const { GOOGLE_GEMINI_API_KEY = '' } = process.env || {}

const MODEL_NAME = 'gemini-pro'
const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: MODEL_NAME })

const defaultGenerationConfig: IGenerationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
}

const defaultSafetySettings: ISafetySetting[] = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
]

interface IGeminiChatProps {
    generationConfig?: IGenerationConfig
    safetySettings?: ISafetySetting[]
    history?: IChatItem[]
    inputText: string
    isStream?: boolean
}

export const GeminiChat = async ({
    generationConfig,
    safetySettings,
    history,
    inputText,
    isStream,
}: IGeminiChatProps) => {
    let error = `input text is required.`
    if (!inputText)
        return {
            status: false,
            text: ``,
            error,
        }

    let params: Partial<IGeminiChatProps> = {
        generationConfig: {
            ...defaultGenerationConfig,
            ...generationConfig,
        },
        safetySettings: _.isEmpty(safetySettings)
            ? defaultSafetySettings
            : _.map(defaultSafetySettings, ss => {
                  const category = ss.category
                  const newSS = _.find(safetySettings, category)
                  return {
                      ...ss,
                      threshold: newSS?.threshold || ss.threshold,
                  }
              }),
        history: _.map(history, h => {
            return {
                role: h.role,
                parts: h.parts,
            }
        }),
    }
    if (_.isEmpty(history)) {
        delete params.history
    }

    try {
        const chat = model.startChat(params)

        const currentHistory = await chat.getHistory()
        const { totalTokens } = await model.countTokens({
            contents: [...currentHistory, { role: 'user', parts: [{ text: inputText }] }],
        })
        if (isStream) {
            const streamResult = await chat.sendMessageStream(inputText)
            let text = ''
            for await (const chunk of streamResult.stream) {
                const chunkText = chunk.text()
                console.log(chunkText)
                text += chunkText
            }

            return {
                status: true,
                text,
                totalTokens,
            }
        }
        const result = await chat.sendMessage(inputText)

        const response = result.response
        return {
            status: true,
            text: response.text(),
            totalTokens,
        }
    } catch (e) {
        console.log(`GeminiChat error`, e)
        error = String(e)
    }

    return {
        status: false,
        text: ``,
        error,
    }
}

export const GeminiTokenCount = async ({ prompt, imageParts, history }: IGeminiTokenCountProps) => {
    let totalTokens = 0,
        countTokensResult

    if (!prompt && !imageParts?.length && !history?.length) {
        return { totalTokens }
    }

    if (prompt && imageParts?.length) {
        countTokensResult = await model.countTokens([prompt, ...imageParts])
    } else if (prompt) {
        countTokensResult = await model.countTokens([prompt])
    } else if (history) {
        countTokensResult = await model.countTokens({
            contents: [...history],
        })
    }

    totalTokens = countTokensResult?.totalTokens || totalTokens

    return { totalTokens }
}
