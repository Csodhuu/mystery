"use client";
import { useEffect, useState } from "react";

const KEY = "age_ok_v1";

export function AgeGate() {
  const [show, setShow] = useState(false);
  const [denied, setDenied] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-md">
      <div className="card w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border-2 border-rose-500 text-2xl font-black text-rose-400">18+</div>
        {denied ? (
          <>
            <h2 className="text-xl font-bold text-white">Уучлаарай</h2>
            <p className="muted mt-2">Энэ сайтыг зөвхөн 18 нас хүрсэн хүмүүс ашиглах боломжтой.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">Та 18 нас хүрсэн үү?</h2>
            <p className="muted mt-2">
              Хайрцаг.mn нь санамсаргүй шагналтай үйлчилгээ тул зөвхөн насанд хүрэгчдэд зориулагдсан. Үргэлжлүүлснээр та{" "}
              <a href="/terms" className="text-neon underline">
                Үйлчилгээний нөхцөл
              </a>
              -ийг зөвшөөрч байна.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="btn-ghost" onClick={() => setDenied(true)}>
                Үгүй
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  try {
                    localStorage.setItem(KEY, "1");
                  } catch {}
                  setShow(false);
                }}
              >
                Тийм, 18+
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
