/** Generate a stable node ID for template persistence */
export function generateNodeId(): string {
  return crypto.randomUUID();
}
