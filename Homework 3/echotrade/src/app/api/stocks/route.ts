import { NextResponse } from "next/server";
import { getStockHistories } from "@/lib/db/actions/stocks";

export async function GET() {
  const histories = await getStockHistories();
  return NextResponse.json(histories);
}
