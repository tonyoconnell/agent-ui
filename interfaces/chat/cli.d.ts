// CLI chat command contract
export interface CliChatArgs {
  message: string
  session?: string     // session ID to resume
  json?: boolean       // output JSON
}
