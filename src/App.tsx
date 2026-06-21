import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  PenTool,
  Copy,
  Check,
  Download,
  Flame,
  Wand2,
  Trash2,
  ChevronRight,
  RefreshCw,
  Clock,
  Plus,
  ArrowLeft,
  ChevronLeft,
  HelpCircle,
  Info,
  Layers,
  BookMarked,
  FileText
} from "lucide-react";
import { BlogOutline, OutlineSection, SavedBlog } from "./types";
import MarkdownRenderer from "./components/MarkdownRenderer";
import OutlineCustomizer from "./components/OutlineCustomizer";
import HistoryLibrary from "./components/HistoryLibrary";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_TOPICS = [
  "Digital Marketing Tips for Small Businesses in 2026",
  "Why AI will not replace but augment creative designers",
  "Top 10 Street Food spots in Mumbai that you cannot miss",
  "A beginner guide to building passive income using web tools",
];

export default function App() {
  // Inputs state
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [length, setLength] = useState("medium");
  const [keywords, setKeywords] = useState("");

  // Grid/UI states
  const [step, setStep] = useState<"input" | "outline" | "blog">("input");
  const [outlineData, setOutlineData] = useState<BlogOutline | null>(null);
  const [blogContent, setBlogContent] = useState("");
  const [finalTitle, setFinalTitle] = useState("");
  const [savedBlogs, setSavedBlogs] = useState<SavedBlog[]>([]);
  const [activeBlogId, setActiveBlogId] = useState<string | null>(null);

  // Status/Processing states
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [generationMsg, setGenerationMsg] = useState("");

  // Loading animations message rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingOutline) {
      const msgs = [
        "Analyzing topic & SEO competition... 🔍",
        "Engaging King's creative braincells... 🧠",
        "Brainstorming high-converting headings... ⚡",
        "Structuring engaging intro & outro hooks... 👑",
        "Organizing logical paragraph sequences... 📜",
      ];
      let i = 0;
      setGenerationMsg(msgs[0]);
      interval = setInterval(() => {
        i = (i + 1) % msgs.length;
        setGenerationMsg(msgs[i]);
      }, 3000);
    } else if (isGeneratingBlog) {
      const msgs = [
        "Gathering facts & structuring transition phrases... 📃",
        "Writing detailed body paragraphs... ✍️",
        "Injecting custom selected tone vibe... 🎭",
        "Weaving SEO keywords seamlessly... 🔑",
        "Polishing call-to-actions and conclusions... 👑",
        "Double checking read-retention levels... 💥",
      ];
      let i = 0;
      setGenerationMsg(msgs[0]);
      interval = setInterval(() => {
        i = (i + 1) % msgs.length;
        setGenerationMsg(msgs[i]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingOutline, isGeneratingBlog]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("king_blog_history");
    if (saved) {
      try {
        setSavedBlogs(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse history.");
      }
    }
  }, []);

  // Save history helper
  const saveToHistory = (titleStr: string, contentStr: string) => {
    const newBlog: SavedBlog = {
      id: crypto.randomUUID(),
      title: titleStr || topic,
      topic: topic,
      tone: tone,
      content: contentStr,
      keywords: keywords,
      wordCount: contentStr.split(/\s+/).filter(Boolean).length,
      createdAt: new Date().toISOString(),
    };
    const updated = [newBlog, ...savedBlogs];
    setSavedBlogs(updated);
    localStorage.setItem("king_blog_history", JSON.stringify(updated));
    setActiveBlogId(newBlog.id);
  };

  // Delete previous item
  const handleDeleteBlog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedBlogs.filter((b) => b.id !== id);
    setSavedBlogs(updated);
    localStorage.setItem("king_blog_history", JSON.stringify(updated));
    if (activeBlogId === id) {
      setActiveBlogId(null);
      setBlogContent("");
      setFinalTitle("");
    }
  };

  // View historical blog
  const handleSelectBlog = (blog: SavedBlog) => {
    setFinalTitle(blog.title);
    setBlogContent(blog.content);
    setTopic(blog.topic);
    setTone(blog.tone);
    setKeywords(blog.keywords || "");
    setActiveBlogId(blog.id);
    setStep("blog");
    if (window.innerWidth < 768) {
      setShowHistory(false);
    }
  };

  // Core action: Generate proposed blog outline
  const generateOutline = async () => {
    if (!topic.trim()) {
      setError("Topic cannot be empty, King!");
      return;
    }
    setIsGeneratingOutline(true);
    setError(null);
    setOutlineData(null);

    try {
      const response = await fetch("/api/blog/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, keywords, length }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Internal Server Error");
      }

      const data: BlogOutline = await response.json();
      setOutlineData(data);
      setFinalTitle(data.title);
      setStep("outline");
    } catch (err: any) {
      setError(err?.message || "Failed to generate blog outline. Try again!");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  // Core action: Generate full blog post
  const generateFullBlog = async () => {
    if (!outlineData) return;
    setIsGeneratingBlog(true);
    setError(null);
    setStep("blog");

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone,
          keywords,
          title: finalTitle,
          outline: outlineData.outline,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation error");
      }

      const data = await response.json();
      setBlogContent(data.content);

      // Save this beautiful draft immediately
      saveToHistory(finalTitle, data.content);
    } catch (err: any) {
      setError(err?.message || "Failed to generate. Please click retry!");
    } finally {
      setIsGeneratingBlog(false);
    }
  };

  const handleCopyBlog = () => {
    if (!blogContent) return;
    navigator.clipboard.writeText(`# ${finalTitle}\n\n${blogContent}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadBlog = () => {
    if (!blogContent) return;
    const fullText = `# ${finalTitle}\n\n${blogContent}`;
    const fileBlob = new Blob([fullText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");
    link.href = url;
    // Clean file name
    const safeName = finalTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 50);
    link.download = `${safeName || "blog-post"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Direct generation option (bypass visible outline edit step)
  const handleQuickGenerate = async () => {
    if (!topic.trim()) {
      setError("Topic cannot be empty, King!");
      return;
    }
    setIsGeneratingOutline(true);
    setError(null);

    try {
      // 1. Fetch proposed outline
      const response = await fetch("/api/blog/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, keywords, length }),
      });
      if (!response.ok) throw new Error("Outline draft failed.");
      const data: BlogOutline = await response.json();

      setOutlineData(data);
      setFinalTitle(data.title);
      setIsGeneratingOutline(false);

      // 2. Fetch full blog from that outline
      setIsGeneratingBlog(true);
      setStep("blog");

      const blogResponse = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          tone,
          keywords,
          title: data.title,
          outline: data.outline,
        }),
      });

      if (!blogResponse.ok) throw new Error("Blog compilation failed.");
      const blogData = await blogResponse.json();

      setBlogContent(blogData.content);
      saveToHistory(data.title, blogData.content);
    } catch (err: any) {
      setError(err?.message || "Quick generate encountered an issue. Let's try again!");
      setIsGeneratingOutline(false);
      setIsGeneratingBlog(false);
    }
  };

  const getToneBadgeStyle = (currentTone: string) => {
    switch (currentTone) {
      case "king_style":
        return "bg-gradient-to-r from-purple-600 to-amber-600 text-white font-black animate-pulse shadow shadow-amber-500/20";
      case "professional":
        return "bg-blue-600/30 border border-blue-500/40 text-blue-200";
      case "casual":
        return "bg-emerald-600/30 border border-emerald-500/40 text-emerald-200";
      case "funny":
        return "bg-yellow-600/30 border border-yellow-500/40 text-yellow-200";
      case "seo":
        return "bg-cyan-600/30 border border-cyan-500/40 text-cyan-200";
      default:
        return "bg-slate-800 text-slate-300";
    }
  };

  const getToneLabel = (currentTone: string) => {
    switch (currentTone) {
      case "king_style":
        return "👑 King Style (Hinglish Power)";
      case "professional":
        return "👔 Professional / Authority";
      case "casual":
        return "🌿 Casual & Conversational";
      case "funny":
        return "🎭 Funny / Playful Witty";
      case "seo":
        return "🔍 Search Engine Optimized";
      default:
        return currentTone;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans relative flex flex-col antialiased">
      {/* Dynamic ambient bg ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-700/5 blur-[120px] pointer-events-none" />

      {/* Main Nav / Bar */}
      <header className="sticky top-0 z-40 bg-[#0F0F12] border-b border-slate-800 px-4 md:px-8 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <span className="text-2xl">👑</span>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
              AI BLOG <span className="text-indigo-400">KING</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Empire Grade Generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              showHistory
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" />
            <span>Kings Library</span>
            {savedBlogs.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${showHistory ? "bg-indigo-950 text-indigo-300" : "bg-slate-900 text-indigo-400"}`}>
                {savedBlogs.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 md:grid md:grid-cols-12 md:items-start relative">
        
        {/* Sidebar Panel: Saved history on desktop/overlay */}
        <div
          className={`md:col-span-4 lg:col-span-3 h-full transition-all duration-300 ${
            showHistory ? "block md:order-last" : "hidden"
          }`}
        >
          <HistoryLibrary
            savedBlogs={savedBlogs}
            activeBlogId={activeBlogId}
            onSelectBlog={handleSelectBlog}
            onDeleteBlog={handleDeleteBlog}
            onClose={() => setShowHistory(false)}
          />
        </div>

        {/* Center Panel (Step layouts) */}
        <div className={`md:col-span-12 ${showHistory ? "md:col-span-8 lg:col-span-9" : "md:col-span-12"} space-y-6 transition-all duration-300`}>
          
          {/* Global error notification banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-950/40 border border-red-900/60 rounded-2xl flex items-start gap-3"
            >
              <div className="text-lg mt-0.5">⚠️</div>
              <div className="flex-1">
                <span className="font-bold text-red-200">Garbar Error, King:</span>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-xs font-bold text-red-400 hover:text-red-200 px-2.5 py-1 rounded-lg bg-red-900/25"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Master Steps render */}
          <AnimatePresence mode="wait">
            
            {/* Step 1: Input Setup details */}
            {step === "input" && !isGeneratingOutline && !isGeneratingBlog && (
              <motion.div
                key="step-input"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-12 gap-6"
              >
                {/* Inputs card configuration */}
                <div className="md:col-span-7 bg-[#0F0F12] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-5">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-600/5 blur-3xl pointer-events-none" />
                  
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-600/10 px-2.5 py-0.5 rounded-full inline-block border border-indigo-500/20 mb-2">
                      New Blog Config 👑
                    </span>
                    <h2 className="text-xl font-bold text-white flex items-center gap-1.5">
                      Configure Your Masterpiece
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Provide parameters, specify the perfect target audience tone, and watch the AI sculpt supreme copy.
                    </p>
                  </div>

                  {/* Blog Topic */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      Campaign Topic
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Why Artificial Intelligence won't replace designers but gives them superpowers..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 transition-all placeholder-slate-500"
                    />

                    {/* Quick suggestion tags */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                        Need an idea? Try these topics:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {INITIAL_TOPICS.map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTopic(t)}
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-400 px-2.5 py-1.5 rounded-lg text-left truncate max-w-full transition-all"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Writing Tone Selector */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      Narrative Persona
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "casual", label: "🌿 Casual & Witty", desc: "Friendly tone format" },
                        { id: "professional", label: "👔 Thought Leader", desc: "Authoritative & clear" },
                        { id: "seo", label: "📈 Growth Hacker", desc: "SEO keywords optimized" },
                        { id: "funny", label: "🎭 The Storyteller", desc: "Narrative & creative" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTone(t.id)}
                          className={`p-3 text-left rounded-lg border transition-all text-sm flex flex-col gap-0.5 ${
                            tone === t.id
                              ? "bg-indigo-600/10 border-indigo-500 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60"
                          }`}
                        >
                          <span className="font-bold text-xs">{t.label}</span>
                          <span className="text-[10px] text-slate-500">{t.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Hinglish King style Highlight */}
                    <button
                      type="button"
                      onClick={() => setTone("king_style")}
                      className={`w-full mt-2 p-3 text-left rounded-lg border transition-all relative overflow-hidden flex items-center justify-between gap-3 ${
                        tone === "king_style"
                          ? "bg-purple-950/20 border-purple-500 text-white shadow shadow-purple-500/10"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-xl pointer-events-none" />
                      <div>
                        <span className="font-black text-xs text-purple-200 block">👑 Legendary King Style</span>
                        <span className="text-[10px] text-slate-505 block mt-0.5">
                          Fun Hinglish blend ("King, dhyan se suno!"). Massive authority!
                        </span>
                      </div>
                      <span className="p-1 px-2 rounded bg-purple-500/20 border border-purple-500/30 text-[9px] font-bold text-purple-300 uppercase shrink-0">
                        OP Combo
                      </span>
                    </button>
                  </div>

                  {/* Blog Length Preference */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      Target Post Size
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "short", label: "Quick (~500w)", desc: "Perfect for newsletters" },
                        { id: "medium", label: "Standard (~1000w)", desc: "Great for index rankings" },
                        { id: "expanded", label: "Detailed (~1500w+)", desc: "Exhaustive review piece" },
                      ].map((len) => (
                        <button
                          key={len.id}
                          type="button"
                          onClick={() => setLength(len.id)}
                          className={`p-3 text-center rounded-lg border transition-all flex flex-col justify-center gap-0.5 ${
                            length === len.id
                              ? "bg-indigo-600/10 border-indigo-500 text-white font-semibold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span className="text-xs font-bold">{len.label}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">{len.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SEO Keywords (Optional) */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      Optional SEO Keywords
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. artificial intelligence, minimal design, UX theory..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-200 transition-all placeholder-slate-500"
                    />
                  </div>

                  {/* Control / Generate Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2.5 mt-2 pt-4 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={generateOutline}
                      disabled={!topic.trim()}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      <Layers className="h-4 w-4" />
                      Plan Outline First (Recommended)
                    </button>

                    <button
                      type="button"
                      onClick={handleQuickGenerate}
                      disabled={!topic.trim()}
                      className="sm:w-48 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      Direct Generation
                    </button>
                  </div>
                </div>

                {/* Info side column block */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="bg-[#0F0F12] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex-1">
                    <h3 className="text-sm font-bold text-white mb-2.5 flex items-center gap-2">
                      <span className="text-indigo-400">❓</span> Why Customize Outlines?
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Writing exceptional blog copy requires structure. By choosing to <strong className="text-indigo-400">Plan Outline First</strong>, we generate the H2/H3 skeleton of your article so you can:
                    </p>
                    <ul className="text-xs text-slate-400 leading-relaxed mt-2.5 space-y-2 pl-4 list-disc">
                      <li>Insert custom heading ideas that are hyper-specific to your niche.</li>
                      <li>Remove sections that don't match your scope.</li>
                      <li>Adjust Heading Levels (H2 for standard divisions/H3 for detailed subsections).</li>
                      <li>Tell the AI precisely what points to prioritize in each paragraph.</li>
                    </ul>

                    {/* How It works card mockup preview */}
                    <div className="bg-slate-905 bg-black/40 border border-slate-800 p-4 rounded-xl mt-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Skeleton Blueprint</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded font-mono">YAML-Valid</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-1/3 bg-slate-800 rounded" />
                        <div className="h-1.5 w-5/6 bg-slate-800 rounded" />
                        <div className="h-1 w-2/3 bg-slate-800/40 rounded" />
                        <div className="h-1.5 w-1/2 bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* King's Tip Card */}
                  <div className="bg-gradient-to-tr from-[#0F0F12] to-indigo-950/20 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                    <span className="absolute top-1 right-2 text-4xl opacity-10 font-bold pointer-events-none select-none">💡</span>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">King's Tip 👑</h4>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      Try selecting <span className="text-indigo-400 font-extrabold">👑 Legendary King Style</span>, because it delivers high-retention copywriting that feels incredibly bold and engaging for modern tech and casual creators. This is exclusive to this generator!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Steps: Generational loader overlays */}
            {(isGeneratingOutline || isGeneratingBlog) && (
              <motion.div
                key="step-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0F0F12] border border-slate-800 rounded-2xl p-12 text-center shadow-xl max-w-lg mx-auto my-12 relative overflow-hidden"
              >
                {/* Glowing radial back */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-indigo-500/10 blur-[60px]" />
                
                {/* Spinner */}
                <div className="relative inline-flex mb-6">
                  <div className="h-14 w-14 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">⚡</span>
                </div>

                <h3 className="text-md font-bold text-white tracking-tight">
                  {isGeneratingOutline ? "Sculpting proposed outline..." : "Drafting full-length article..."}
                </h3>
                
                {/* Spinning task updates text */}
                <p className="text-xs font-semibold text-indigo-400 mt-2.5 h-6 animate-pulse transition-all uppercase tracking-wider">
                  {generationMsg}
                </p>

                <p className="text-xs text-slate-400 mt-6 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  Kings Gemini-flash is generating precise content structures. This normally takes about 5 to 15 seconds. Please do not close the browser tab.
                </p>
              </motion.div>
            )}

            {/* Step 2: Customise proposed outline schema */}
            {step === "outline" && outlineData && !isGeneratingOutline && !isGeneratingBlog && (
              <motion.div
                key="step-outline"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-3xl mx-auto"
              >
                <OutlineCustomizer
                  outlineData={outlineData}
                  onUpdateOutline={(updated) => setOutlineData(updated)}
                  onProceedToGenerate={generateFullBlog}
                  onBackToInputs={() => setStep("input")}
                  isGeneratingBlog={isGeneratingBlog}
                />
              </motion.div>
            )}

            {/* Step 3: Finished Viewer with custom markdown elements */}
            {step === "blog" && !isGeneratingOutline && !isGeneratingBlog && (
              <motion.div
                key="step-blog"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid md:grid-cols-12 gap-6"
              >
                {/* Main article body panel */}
                <div className="md:col-span-8 bg-[#0F0F12] border border-slate-800 rounded-xl p-8 shadow-xl relative overflow-hidden flex flex-col">
                  {/* Glowing background */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-3xl pointer-events-none" />

                  {/* Header metadata view details */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-slate-850 pb-6 mb-8 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getToneBadgeStyle(tone)}`}>
                          {getToneLabel(tone)}
                        </span>
                        {keywords && (
                          <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-400 font-bold uppercase tracking-tight truncate">
                            #{keywords}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">
                        {finalTitle}
                      </h2>
                      <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wider">
                        Topic: {topic}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-start">
                      <button
                        onClick={() => {
                          setStep("outline");
                        }}
                        className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Layers className="h-3.5 w-3.5 text-indigo-400" />
                        Edit Outline
                      </button>
                    </div>
                  </div>

                  {/* Clean rendered markdown text layout */}
                  <div className="flex-1 bg-transparent px-1 py-4 md:px-2 rounded-xl">
                    <MarkdownRenderer content={blogContent} />
                  </div>

                  {/* WordCount / Info bar at bottom */}
                  <div className="border-t border-slate-800 mt-6 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-400 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-xs">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <strong>{blogContent.split(/\s+/).filter(Boolean).length}</strong> Words
                      </span>
                      <span className="h-3 w-px bg-slate-800" />
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        Est. read: <strong>{Math.ceil(blogContent.split(/\s+/).filter(Boolean).length / 225)}</strong> mins
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Auto-saved in Kings Library. Use Copy or Download to save to disk.
                    </p>
                  </div>
                </div>

                {/* Sidebar Quick controls and parameters info */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  
                  {/* Actions Drawer */}
                  <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-4">
                    <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Actions Center 👑
                    </h3>
                    <div className="h-px bg-slate-800/60 my-0.5" />

                    {/* Copy button */}
                    <button
                      onClick={handleCopyBlog}
                      className={`w-full py-3 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        copied
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/10"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Content
                        </>
                      )}
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={handleDownloadBlog}
                      className="w-full py-3 px-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4 text-indigo-400" />
                      Export Markdown File
                    </button>

                    <div className="h-px bg-slate-800/60 my-0.5" />

                    {/* Toggle parameters to run draft again */}
                    <button
                      onClick={() => {
                        setStep("input");
                        setActiveBlogId(null);
                      }}
                      className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-400 hover:text-white rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Generate New Topic
                    </button>
                  </div>

                  {/* Re-generate tone panel */}
                  <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-3">
                    <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Change Writing Tone 🎨
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Love the outline but want to rewrite paragraphs in a completely different voice? Select another preset and hit rewrite:
                    </p>

                    <div className="flex flex-col gap-1.5 mt-1">
                      {[
                        { id: "king_style", label: "👑 Legendary Hinglish King Style" },
                        { id: "casual", label: "🌿 Friendly Casual" },
                        { id: "professional", label: "👔 Corporate Authority" },
                        { id: "seo", label: "🔍 Search Keywords Focused" },
                        { id: "funny", label: "🎭 Playful Funny Witty" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setTone(item.id)}
                          className={`text-left text-xs p-2.5 rounded border transition-all truncate font-medium ${
                            tone === item.id
                              ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={generateFullBlog}
                      className="w-full mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold rounded flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
                      Rewrite Paragraphs Now
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Elegant minimalist footer */}
      <footer className="mt-auto border-t border-slate-800 px-8 py-5 bg-[#0F0F12] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-6 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-slate-500 font-mono">SYSTEMS READY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] text-slate-500 font-mono">GEMINI 3.5 FLASH READY</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-medium tracking-wide">
          MADE BY <span className="text-slate-400">KING</span> FOR KINGS 👑 • V2.4.0
        </div>
      </footer>
    </div>
  );
}
