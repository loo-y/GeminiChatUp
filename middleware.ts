import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { get } from '@vercel/edge-config';
import { decrypt } from './app/shared/utils';

const errorResponseJson = {
    status: false,
    error: `please provide your token or api key`
}
export const preferredRegion = [
    "cle1",
    "iad1",
    "pdx1",
    "sfo1",
    "sin1",
    "syd1",
    "hnd1",
    "kix1",
];

export async function middleware(request: NextRequest) {
    // 没有配置 EDGE_CONFIG 的情况下，默认放过
    const { EDGE_CONFIG = '' } = process.env || {}
    if(!EDGE_CONFIG) return;

    const headersList = headers()
    const geminichatup_user = headersList.get(`geminichatup-user`)|| headersList.get(`Geminichatup-User`)
    const geminichatup_token = headersList.get(`geminichatup-token`) || headersList.get(`Geminichatup-Token`)
    const geminichatup_api = headersList.get('geminichatup-api') || headersList.get(`Geminichatup-Api`)
    if(!geminichatup_api && (!geminichatup_user || !geminichatup_token)){
        return NextResponse.json(errorResponseJson)
    }
    if(geminichatup_user && geminichatup_token){
        const decodeToken = await decrypt(geminichatup_token);
        const user_token_in_edge_config = await get(geminichatup_user);
        if(!user_token_in_edge_config || user_token_in_edge_config !== decodeToken){
            return NextResponse.json(errorResponseJson)
        }
    }else if(geminichatup_api){
        const requestHeaders = new Headers(request.headers)
        const customGeminiAPI = await decrypt(geminichatup_api)
        requestHeaders.set('x-geminipro-api', customGeminiAPI)
        const response = NextResponse.next({
            request: {
              // New request headers
              headers: requestHeaders,
            },
          })
          return response   
    }
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
}