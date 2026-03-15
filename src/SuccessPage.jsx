import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://nodwemqhniihepefkjjl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHdlbXFobmlpaGVwZWZrampsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjMzMDgsImV4cCI6MjA4OTA5OTMwOH0.SNishyQTYhMEjkUlgUGjQyPxSyTuL6TVwHI__eOyrvM"
);

const supabaseAdmin = createClient(
  "https://nodwemqhniihepefkjjl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHdlbXFobmlpaGVwZWZrampsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMzMwOCwiZXhwIjoyMDg5MDk5MzA4fQ.3nWlgR5XuyyrtObV0Uwv9WfUYsXHXqYYfDp4ljutyKY"
);

function generateSlug(name) {
  const clean = (name || "page").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${clean}-${Math.random().toString(36).substring(2, 6)}`;
}

export default function SuccessPage() {
  const [status, setStatus] = useState("loading");
  const [pageUrl, setPageUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    createPage(token);
  }, []);

  const createPage = async (token) => {
    try {
      // جيب البيانات من pending_pages
      const { data, error } = await supabaseAdmin
        .from("pending_pages")
        .select("*")
        .eq("token", token)
        .eq("used", false)
        .single();

      if (error || !data) {
        setStatus("error");
        return;
      }

      const pageData = data.page_data;
      const slug = generateSlug(pageData.lover_name);

      // عمل الصفحة
      const { error: insertError } = await supabaseAdmin.from("pages").insert({
        slug,
        lover_name: pageData.lover_name,
        password: pageData.password,
        message: pageData.message,
        song_url: pageData.song_url || null,
        images: pageData.images || [],
        secret_message: pageData.secret_message || null,
        cards: pageData.cards || null,
        timeline: pageData.timeline || null,
        reasons: pageData.reasons || null,
        relation_date: pageData.relation_date || null,
        song_title: pageData.song_title || null,
        closing_line: pageData.closing_line || null,
      });

      if (insertError) throw insertError;

      // اعمل الـ token used
      await supabaseAdmin
        .from("pending_pages")
        .update({ used: true })
        .eq("token", token);

      const url = `https://couple-pages.vercel.app/for/${slug}`;
      setPageUrl(url);
      setStatus("success");

    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const glass = { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", borderRadius: 24 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a0033,#4b0082,#2b004b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cairo',sans-serif", color: "white", padding: 16, position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(236,72,153,0.15)", top: -80, right: -80, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "rgba(168,85,247,0.15)", bottom: -60, left: -60, filter: "blur(60px)" }} />

      <div style={{ width: "100%", maxWidth: 420, textAlign: "center", position: "relative", zIndex: 1 }}>

        {status === "loading" && (
          <div>
            <div style={{ fontSize: 64, marginBottom: 24, animation: "pulse 1s infinite" }}>💖</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f9a8d4", marginBottom: 8 }}>بيجهز صفحتك...</h2>
            <p style={{ color: "#ccc", fontSize: 14 }}>ثانية واحدة بس ✨</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f9a8d4", marginBottom: 8 }}>صفحتك جاهزة!</h2>
            <p style={{ color: "#ccc", fontSize: 14, marginBottom: 32 }}>ابعت الرابط لحبيبتك وسيبها تكتشف ❤️</p>

            <div style={{ ...glass, padding: 20, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "#f9a8d4", marginBottom: 8 }}>رابط صفحتك</p>
              <p style={{ fontSize: 13, fontWeight: 700, wordBreak: "break-all", marginBottom: 16 }}>{pageUrl}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: copied ? "rgba(34,197,94,0.3)" : "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
              >
                {copied ? "✓ تم النسخ!" : "📋 انسخ الرابط"}
              </button>
            </div>

            <button
              onClick={() => window.location.href = pageUrl}
              style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
            >
              👀 شوف الصفحة
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <div style={{ fontSize: 64, marginBottom: 24 }}>😕</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>حصل مشكلة</h2>
            <p style={{ color: "#ccc", fontSize: 14, marginBottom: 24 }}>الرابط مش صح أو اتستخدم قبل كده</p>
            <button
              onClick={() => window.location.href = "/"}
              style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "linear-gradient(to right,#ec4899,#f43f5e)", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
            >
              ارجع للرئيسية
            </button>
          </div>
        )}

      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}`}</style>
    </div>
  );
}
