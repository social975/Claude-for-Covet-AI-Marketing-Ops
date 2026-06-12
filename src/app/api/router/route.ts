import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lazy-initialize so build doesn't fail when key isn't set
let anthropic: Anthropic | null = null
function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropic
}

const SYSTEM_PROMPT = `You are an AI Marketing Operations analyst for Covet & Mane, a luxury beauty/lifestyle brand.
Analyze marketing workflow inputs and return ONLY a valid JSON object — no prose, no markdown fences.

JSON schema (all fields required):
{
  "analysis": "string — concise situational analysis (2-3 sentences)",
  "workflow_step": "analysis | decision | automation | execution",
  "recommendations": ["array of 3-5 specific, actionable recommendations"],
  "relevant_tools": ["tools from: Claude, Make.com, Pipedream, Slack, Notion, Klaviyo, Shopify, Frame.io, Canva AI, Descript, Paperform, Refersion"],
  "automatable": true | false,
  "priority": "high | medium | low",
  "next_steps": ["array of 2-3 immediate next steps"],
  "maturity_level": 0 to 5
}`

export interface RouterResponse {
  source: string
  content: string
  analysis: string
  workflow_step: string
  recommendations: string[]
  relevant_tools: string[]
  automatable: boolean
  priority: 'high' | 'medium' | 'low'
  next_steps: string[]
  maturity_level: number
}

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { source?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { source, content } = body

  if (!source || !content || typeof source !== 'string' || typeof content !== 'string') {
    return NextResponse.json({ error: 'source and content are required strings' }, { status: 400 })
  }

  if (content.length > 4000) {
    return NextResponse.json({ error: 'content exceeds maximum length of 4000 characters' }, { status: 400 })
  }

  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = await getAnthropic().messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Workflow source: ${source}\n\nQuery/context: ${content}`,
          },
        ],
      })

      const raw =
        message.content[0].type === 'text' ? message.content[0].text.trim() : ''

      // Extract JSON — model should return only JSON but strip any wrapping just in case
      const jsonStart = raw.indexOf('{')
      const jsonEnd = raw.lastIndexOf('}')
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON object in model response')
      }

      const structured = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Omit<
        RouterResponse,
        'source' | 'content'
      >

      return NextResponse.json({ source, content, ...structured } satisfies RouterResponse)
    } catch (err) {
      if (attempt === maxRetries) {
        console.error('[AI Router] Failed after retries:', err)
        return NextResponse.json(
          { error: 'AI Router failed. Please try again.' },
          { status: 502 }
        )
      }
      // Exponential back-off: 1s, 2s, 4s
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
    }
  }

  // Should never reach here
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
}
