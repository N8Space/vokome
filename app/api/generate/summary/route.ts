import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("GOOGLE_API_KEY is not set");
            return NextResponse.json({ error: "Service configuration error" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Summarize the following text into a concise, engaging script for a 30-second educational video. 
    The script should be approximately 70-80 words long. 
    Focus on the most interesting facts. 
    Do not include scene directions, just the spoken text.
    
    Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return NextResponse.json({ summary });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({
            error: `Gemini Error: ${error.message || "Unknown error"}`,
            details: error.toString()
        }, { status: 500 });
    }
}
