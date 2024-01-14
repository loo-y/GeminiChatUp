import _ from 'lodash'
import { IChatItem, IGenerationConfig, ISafetySetting, IGeminiTokenCountProps } from '../shared/interfaces'
import { fetchTimeout } from './utils'
import { Part } from '@google/generative-ai'

const commonOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
}

export const fetchGeminiChat = async ({
    history,
    inputText,
    conversationId,
    generationConfig,
    safetySettings,
}: {
    history?: IChatItem[]
    inputText: string
    conversationId: string
    generationConfig?: IGenerationConfig
    safetySettings?: ISafetySetting[]
}) => {
    const jsonBody = _.omitBy(
        {
            history,
            inputText,
            generationConfig,
            safetySettings,
        },
        _.isUndefined
    )

    let result = {}
    try {
        const response = await Promise.race([
            fetch('/api/geminichat', {
                ...commonOptions,
                body: JSON.stringify({ ...jsonBody }),
            }),
            fetchTimeout(20),
        ])
        if (response instanceof Response) {
            result = await response.json()
        } else {
            console.log(`race failed`)
            result = {
                status: false,
                error: `unknow expection`,
            }
        }
    } catch (e) {
        console.log(`fetchGeminiChat error`, e)
        result = {
            status: false,
            error: String(e) || `unknow expection`,
        }
    }

    return { ...result, conversationId }
}

export const fetchGeminiContent = async ({
    parts,
    conversationId,
    generationConfig,
    safetySettings,
}: {
    parts: Part[]
    conversationId: string
    generationConfig?: IGenerationConfig
    safetySettings?: ISafetySetting[]
}) => {
    const jsonBody = _.omitBy(
        {
            parts,
            generationConfig,
            safetySettings,
        },
        _.isUndefined
    )

    let result = {
        status: true,
    } as Record<string, any>
    try {
        const response = await Promise.race([
            fetch('/api/geminicontent', {
                ...commonOptions,
                body: JSON.stringify({ ...jsonBody }),
            }),
            fetchTimeout(20),
        ])
        if (response instanceof Response) {
            result = await response.json()
        } else {
            console.log(`race failed`)
            result = {
                status: false,
                error: `unknow expection`,
            }
        }
    } catch (e) {
        console.log(`fetchGeminiContent error`, e)
        result = {
            status: false,
            error: String(e) || `unknow expection`,
        }
    }

    return { ...result, conversationId }
}

export const fetchTokenCount = async ({ history, prompt, parts, limit }: IGeminiTokenCountProps) => {
    const jsonBody = _.omitBy(
        {
            history,
            prompt,
            parts,
            limit,
        },
        item => {
            return _.isUndefined(item) || (!_.isNumber(item) && _.isEmpty(item))
        }
    )

    let result: { totalTokens?: number; validIndex?: number } = {}

    try {
        const response = await Promise.race([
            fetch('/api/geminitokens', {
                ...commonOptions,
                body: JSON.stringify({ ...jsonBody }),
            }),
            fetchTimeout(30),
        ])
        if (response instanceof Response) {
            result = await response.json()
        } else {
            console.log(`race failed`)
        }
    } catch (e) {
        console.log(`fetchGeminiChat error`, e)
    }

    return { ...result }
}
