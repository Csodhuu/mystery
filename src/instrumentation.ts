export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DEMO_MODE === "true") {
    const { startDemoJobs } = await import("./server/demo-jobs");
    startDemoJobs();
  }
}
