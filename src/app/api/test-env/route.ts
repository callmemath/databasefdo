import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.DISCORD_BOT_API_TOKEN;
  
  return NextResponse.json({
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 10)}...` : 'NON TROVATO',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('DISCORD'))
  });
}
