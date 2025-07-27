import { NextResponse } from "next/server";

export async function GET() {
    try {
        return new NextResponse("OK", { status: 200 });
    } catch (err) {
        console.error("CRON ERROR:", err);
        return new NextResponse("ERR", { status: 500 });
    }
}
