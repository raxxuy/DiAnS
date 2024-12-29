import { LSTM } from "@/lib/predictions/lstm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const issuer_id = searchParams.get("issuer_id");

  if (!issuer_id) {
    return NextResponse.json({ error: "Missing issuer_id" }, { status: 400 });
  }

  const predictions = await LSTM(parseInt(issuer_id));

  if (!predictions) {
    return NextResponse.json({ error: "No predictions data found" }, { status: 404 });
  }

  return NextResponse.json(predictions);
} 