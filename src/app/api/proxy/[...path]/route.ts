import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
    try {
        const pathArray = params.path;
        const service = pathArray[0];
        const apiPath = pathArray.slice(1).join('/');

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        let targetBaseUrl = "";

        if (service === "listenfree") {
            if (!process.env.LISTENFREE_API_URL) {
                return new NextResponse("Listenfree API URL not configured", { status: 500 });
            }
            targetBaseUrl = process.env.LISTENFREE_API_URL;

        } else if (service === "saavn") {
            if (!process.env.SAAVN_API_URL) {
                return new NextResponse("Saavn API URL not configured", { status: 500 });
            }
            targetBaseUrl = process.env.SAAVN_API_URL;

        } else if (service === "sanvia") {
            if (!process.env.SANVIA_BASE_API_URL) {
                return new NextResponse("Sanvia base API not configured", { status: 500 });
            }
            targetBaseUrl = process.env.SANVIA_BASE_API_URL;

        } else {
            return new NextResponse("Invalid service requested", { status: 400 });
        }

        const finalUrl = `${targetBaseUrl}/${apiPath}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(finalUrl, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Third-party API failed with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("UNIVERSAL PROXY ERROR:", error);
        return new NextResponse("Internal Server Error fetching data", { status: 500 });
    }
}