import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import _ from 'lodash'
import { ISafetySetting, IGenerationConfig, IChatItem } from './interface'
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

const GeminiChat = async ({ generationConfig, safetySettings, history, inputText, isStream }: IGeminiChatProps) => {
    let error = `input text is required.`
    if (!inputText)
        return {
            status: false,
            text: ``,
            error,
        }

    let params = {
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
        history,
    }
    if (_.isEmpty(history)) {
        delete params.history
    }

    try {
        const chat = model.startChat(params)
        const result = await chat.sendMessage(inputText)
        const response = result.response
        return {
            status: true,
            text: response.text(),
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

export default GeminiChat
