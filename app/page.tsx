import ChatPage from './(pages)/chat/page'

export default function Home() {
    const { EDGE_CONFIG = '' } = process.env || {}
    return <ChatPage needAPICredentials={!!EDGE_CONFIG} />
}
