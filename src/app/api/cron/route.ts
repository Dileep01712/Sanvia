import { NextResponse } from "next/server";

export async function GET() {
    try {
        return new NextResponse("Service is awake", { status: 200 });
    } catch (err) {
        console.error("Keep-alive ping failed:", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}