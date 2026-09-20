// GET/PUT /admin/prompts/paper-summary — the single global prompt used for every user's
// AI paper-summary generation. `prompt_text` is null until an admin has ever set one.
export interface PaperSummaryPrompt {
  prompt_text: string | null
}
