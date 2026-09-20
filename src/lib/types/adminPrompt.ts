// GET/PUT /admin/prompts/paper-summary — the single global prompt used for every user's
// AI paper-summary generation. `prompt_text` is null until an admin has ever set one.
// `max_file_size_bytes` is always present — defaults server-side to 20MB when unset.
export interface PaperSummaryPrompt {
  prompt_text: string | null
  max_file_size_bytes: number
}
