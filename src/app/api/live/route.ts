import { recentDrops } from "@/server/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Server-Sent Events: initial batch, then new drops as they appear (DB-polled, so it works across processes). */
export async function GET(req: Request) {
  const enc = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!closed) controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const initial = await recentDrops(0, 20);
      let lastId = initial[0]?.id ?? 0;
      send("init", initial);
      timer = setInterval(async () => {
        try {
          const fresh = await recentDrops(lastId, 20);
          if (fresh.length) {
            lastId = fresh[0].id;
            send("drops", fresh.reverse());
          } else if (!closed) controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {
          /* transient DB error – try next tick */
        }
      }, 1500);
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      closed = true;
      clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
