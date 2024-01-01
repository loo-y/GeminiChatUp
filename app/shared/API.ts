import _ from 'lodash'
import { IChatItem, IGenerationConfig, ISafetySetting } from '../shared/interfaces'
import { fetchTimeout } from './utils'

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
        }
    } catch (e) {
        console.log(`fetchGeminiChat error`, e)
    }

    return { ...result, conversationId }
}
