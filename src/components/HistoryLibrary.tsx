import React, { useState } from "react";
import { Search, Trash2, Calendar, FileText, Sparkles, Check, Copy } from "lucide-react";
import { SavedBlog } from "../types";

interface HistoryLibraryProps {
  savedBlogs: SavedBlog[];
  activeBlogId: string | null;
  onSelectBlog: (blog: SavedBlog) => void;
  onDeleteBlog: (id: string, e: React.MouseEvent) => void;
  onClose?: () => void;
}

export default function HistoryLibrary({
  savedBlogs,
  activeBlogId,
  onSelectBlog,
  onDeleteBlog,
  onClose,
}: HistoryLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredBlogs = savedBlogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyText = (content: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const getToneStyle = (tone: string) => {
    switch (tone) {
      case "professional":
        return "bg-blue-500/15 text-blue-300 border shadow shadow-blue-500/5";
      case "casual":
        return "bg-emerald-500/15 text-emerald-300 border shadow shadow-emerald-500/5";
      case "funny":
        return "bg-yellow-500/15 text-yellow-300 border shadow shadow-yellow-500/5";
      case "seo":
        return "bg-cyan-500/15 text-cyan-300 border shadow shadow-cyan-500/5";
      case "king_style":
        return "bg-purple-500/15 text-purple-300 border border-purple-500/30 font-black animate-pulse shadow shadow-purple-500/10";
      default:
        return "bg-slate-500/15 text-slate-300 border border-slate-700";
    }
  };

  const getToneLabel = (tone: string) => {
    switch (tone) {
      case "king_style":
        return "👑 King Style";
      case "professional":
        return "👔 Professional";
      case "casual":
        return "🌿 Casual";
      case "funny":
        return "🎭 Funny / Witty";
      case "seo":
        return "🔍 SEO Optimized";
      default:
        return tone;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F12] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>👑</span> Kings Library
          </h3>
          <p className="text-xs text-slate-500">Total generated: {savedBlogs.length}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-xs bg-slate-800 border border-slate-750 px-2.5 py-1 rounded text-slate-300 hover:bg-slate-700"
          >
            Close
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search topic or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-700 rounded focus:border-indigo-500 focus:outline-none placeholder-slate-500 text-slate-200"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[480px]">
        {filteredBlogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/20 rounded-xl my-4 border border-dashed border-slate-800">
            <span className="block text-2xl mb-2 text-slate-500">📜</span>
            <p className="text-xs text-slate-400 font-medium">No saved blogs yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">Generate a blog and save it, and it will appear here!</p>
          </div>
        ) : (
          filteredBlogs.map((blog) => {
            const isActive = blog.id === activeBlogId;
            return (
              <div
                key={blog.id}
                onClick={() => onSelectBlog(blog)}
                className={`group p-3.5 rounded px-3.5 border transition-all relative ${
                  isActive
                    ? "bg-slate-900 border-indigo-500/70 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-900/30 border-slate-850 hover:bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                {/* Title */}
                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1 pr-6">
                  {blog.title || blog.topic}
                </h4>

                {/* Sub-info */}
                <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                  Topic: {blog.topic}
                </p>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[10px] text-slate-400">
                  <span className={`px-2 py-0.5 rounded font-medium text-[9px] border-slate-850 ${getToneStyle(blog.tone)}`}>
                    {getToneLabel(blog.tone)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {blog.wordCount || 0} words
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(blog.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleCopyText(blog.content, blog.id, e)}
                    title="Copy full text"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    {copiedId === blog.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => onDeleteBlog(blog.id, e)}
                    title="Delete blog"
                    className="p-1 rounded bg-red-955 bg-red-950/40 border border-red-900/30 hover:bg-red-900/80 text-red-400 hover:text-white transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
