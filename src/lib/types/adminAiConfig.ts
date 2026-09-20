// GET /admin/ai-config — platform-wide AI model settings. All three fields are always
// present — each defaults server-side (gpt-4o / 4096 / nova-3) until an admin overrides it.
export interface AiModelConfig {
  open_ai_chat_model: string
  open_ai_max_tokens: number
  deepgram_model: string
}

// One entry of a Deepgram account's live pay-as-you-go balance. purchase_order_id is
// null for balances not tied to a PO.
export interface DeepgramBalance {
  balance_id: string
  amount: number
  units: string
  purchase_order_id: string | null
}
