import _ from 'lodash'
import {
    IChatItem,
    IGenerationConfig,
    ISafetySetting,
    IGeminiTokenCountProps,
    APICredentials,
} from '../shared/interfaces'
import { getFromLocalStorage, fetchTimeout } from './utils'
import { Part } from '@google/generative-ai'
import { encrypt } from './utils'
import { IGlobalOptionsInfo } from '../(pages)/chat/interface'
import { globalOptionsInfoStoreKey } from './constants'

export const getCommonOptions = async () => {
    const globalOptionsInfo = getFromLocalStorage<IGlobalOptionsInfo>(globalOptionsInfoStoreKey)
    const { geminiUserName, geminiUserToken, customGeminiAPI, useAPICredentials } = globalOptionsInfo || {}
    const userToken =
        useAPICredentials == APICredentials.userToken && geminiUserToken ? await encrypt(geminiUserToken) : undefined
    const userName = useAPICredentials == APICredentials.userToken && geminiUserName ? geminiUserName : undefined
    const geminiapi =
        useAPICredentials == APICredentials.customAPI && customGeminiAPI ? await encrypt(customGeminiAPI) : undefined

    const headers = _.omitBy(
        {
            'Content-Type': 'application/json',
            'geminichatup-user': userName,
            'geminichatup-token': userToken,
            'geminichatup-api': geminiapi,
        },
        _.isUndefined
    ) as Record<string, string>

    let options = {
        method: 'POST',
        headers,
    }
    return options
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
        const commonOptions = await getCommonOptions()
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
        const commonOptions = await getCommonOptions()
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
        const commonOptions = await getCommonOptions()
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
