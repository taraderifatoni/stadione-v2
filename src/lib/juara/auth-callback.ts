export async function handleAuthCallback(
  code: string | null,
  exchange: (code: string) => Promise<{ error: unknown }>
): Promise<string> {
  if (!code) return "/juara/login?error=missing_code"
  const { error } = await exchange(code)
  if (error) return `/juara/login?error=${encodeURIComponent(String(error))}`
  return "/juara"
}
