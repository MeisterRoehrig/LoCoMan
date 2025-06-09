


export async function GET() {
    return Response.json({
        success: true, data: "Thank You"
    },
        { status: 200 }
    )
}


export async function POST(request: Request) {
    const {type, role, test} = await request.json();

    try {
        
    } catch (error) {
        console.error("Error processing POST request:", error);
        return Response.json({
            success: false,
            error: "An error occurred while processing your request. [" + error + "]"
        },
            { status: 500 }
        );
    }
}