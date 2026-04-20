export const clawRegistry: Record<string, string> = {
  debby: 'https://debby-claw.oneie.workers.dev',
  donal: 'https://donal-claw.oneie.workers.dev',
}

export function getClawUrl(groupId: string): string {
  return clawRegistry[groupId] ?? 'https://debby-claw.oneie.workers.dev'
}
