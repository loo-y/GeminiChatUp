import _ from 'lodash'
import { IChatItem } from '../shared/interfaces'
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
}: {
    history?: IChatItem[]
    inputText: string
    conversationId: string
}) => {
    const jsonBody = {
        history,
        inputText,
    }
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
