
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    try {
        console.log("Proxying audio:", url);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Upstream error: ${response.status}`);
        }

        const headers = new Headers(response.headers);
        // Ensure browser treats it as audio, not a download
        headers.set("Content-Type", "audio/mpeg");
        headers.set("Content-Disposition", "inline");
        // Allow Remotion/Client to access it
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(response.body, {
            status: 200,
            statusText: "OK",
            headers
        });

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Proxy failed: " + error.message }, { status: 500 });
    }
}
