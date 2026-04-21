import serverless from "serverless-http";

// Top-level error capture to prevent silent 502 crashes on Netlify
let handler: any;
try {
  const { app } = await import("./app.js");
  handler = serverless(app);
} catch (error) {
  console.error("❌ FATAL INITIALIZATION ERROR:", error);
  handler = async (event: any, context: any) => {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Fatal Initialization Error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        event: event.path
      })
    };
  };
}

export { handler };
