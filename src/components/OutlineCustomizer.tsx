import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, Edit3, Check, ToggleLeft, ToggleRight, MessageSquare, AlertCircle } from "lucide-react";
import { OutlineSection, BlogOutline } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface OutlineCustomizerProps {
  outlineData: BlogOutline;
  onUpdateOutline: (updated: BlogOutline) => void;
  onProceedToGenerate: () => void;
  onBackToInputs: () => void;
  isGeneratingBlog: boolean;
}

export default function OutlineCustomizer({
  outlineData,
  onUpdateOutline,
  onProceedToGenerate,
  onBackToInputs,
  isGeneratingBlog,
}: OutlineCustomizerProps) {
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [editHeading, setEditHeading] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [newHeading, setNewHeading] = useState("");
  const [newLevel, setNewLevel] = useState(2);

  const sections = outlineData.outline;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onUpdateOutline({ ...outlineData, outline: updated });
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onUpdateOutline({ ...outlineData, outline: updated });
  };

  const handleDelete = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    onUpdateOutline({ ...outlineData, outline: updated });
    if (editingSectionIdx === index) {
      setEditingSectionIdx(null);
    }
  };

  const handleToggleLevel = (index: number) => {
    const updated = [...sections];
    updated[index].level = updated[index].level === 2 ? 3 : 2;
    onUpdateOutline({ ...outlineData, outline: updated });
  };

  const startEditing = (idx: number) => {
    setEditingSectionIdx(idx);
    setEditHeading(sections[idx].heading);
    setEditInstructions(sections[idx].instructions);
  };

  const saveEdit = (idx: number) => {
    const updated = [...sections];
    updated[idx] = {
      ...updated[idx],
      heading: editHeading,
      instructions: editInstructions,
    };
    onUpdateOutline({ ...outlineData, outline: updated });
    setEditingSectionIdx(null);
  };

  const handleAddSection = () => {
    if (!newHeading.trim()) return;
    const newSection: OutlineSection = {
      heading: newHeading,
      level: newLevel,
      instructions: "Cover this topic thoroughly. Add relevant details.",
    };
    const updated = [...sections, newSection];
    onUpdateOutline({ ...outlineData, outline: updated });
    setNewHeading("");
  };

  return (
    <div className="bg-[#0F0F12] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative radial lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded inline-block mb-1.5 border border-indigo-500/20">
            Step 2: Customise Skeleton
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            🎨 Craft Outline like a King
          </h2>
          <p className="text-xs text-slate-505 text-slate-550 text-slate-400 mt-1">
            Check, modify or rearrange sections. Double-click or edit talking points so the AI writes exactly what you need.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToInputs}
            disabled={isGeneratingBlog}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 border border-slate-700/80 rounded hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            ← Back to inputs
          </button>
          <button
            onClick={onProceedToGenerate}
            disabled={isGeneratingBlog || sections.length === 0}
            className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded hover:opacity-90 active:scale-95 transition-all outline-none shadow-lg shadow-indigo-650/10 disabled:opacity-50 disabled:pointer-events-none"
          >
            Draft Final Blog 🚀
          </button>
        </div>
      </div>

      {/* Title Editor */}
      <div className="mb-6 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <label className="block text-[10px] font-bold text-indigo-400 tracking-wider uppercase mb-1.5">
          Final Blog Title 📝
        </label>
        <input
          type="text"
          value={outlineData.title}
          onChange={(e) => onUpdateOutline({ ...outlineData, title: e.target.value })}
          placeholder="Enter custom catchy title..."
          className="w-full text-lg font-serif font-bold bg-transparent border-b border-transparent focus:border-indigo-500 pb-1 focus:outline-none text-white placeholder-slate-500"
        />
      </div>

      {/* Drag & Rearrange List */}
      <div className="space-y-3 mb-6">
        {sections.length === 0 && (
          <div className="text-center p-8 border border-dashed border-slate-800 rounded bg-slate-900/10">
            <AlertCircle className="mx-auto h-8 w-8 text-indigo-500 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">No outline sections left.</p>
            <p className="text-xs text-slate-500 mt-1">Use the input form below to add section headers to your blog.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {sections.map((sect, idx) => {
            const isEditing = editingSectionIdx === idx;
            return (
              <motion.div
                key={`${sect.heading}-${idx}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col border rounded overflow-hidden shadow-sm transition-all ${
                  isEditing
                    ? "bg-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/20"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                {/* Standard header layout of the section item */}
                <div className="flex items-center justify-between p-3.5 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Level Badge Toggle */}
                    <button
                      onClick={() => handleToggleLevel(idx)}
                      title={`Currently ${sect.level === 2 ? "H2 (heading)" : "H3 (subheading)"}. Click to toggle.`}
                      className={`px-2 py-0.5 rounded font-mono font-bold text-xs shrink-0 transition-colors ${
                        sect.level === 2
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                          : "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      H{sect.level}
                    </button>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editHeading}
                        onChange={(e) => setEditHeading(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-semibold truncate ${sect.level === 2 ? "text-white text-sm" : "text-slate-300 pl-4 border-l border-slate-800"}`}>
                          {sect.heading}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 inline text-slate-600" />
                          {sect.instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Move, Edit and Delete controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === sections.length - 1}
                      title="Move down"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    {isEditing ? (
                      <button
                        onClick={() => saveEdit(idx)}
                        className="p-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(idx)}
                        title="Edit talking instructions"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(idx)}
                      title="Delete section"
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-editing for detailed instructions */}
                {isEditing && (
                  <div className="bg-[#0A0A0B] px-4 pb-4 pt-1 border-t border-slate-800">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Talking Points / Instructions for AI 🧠:
                    </label>
                    <textarea
                      rows={2}
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Custom Section Form */}
      <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">
            Add Custom Heading ➕
          </label>
          <input
            type="text"
            placeholder="e.g. My Custom Future Trend Prediction..."
            value={newHeading}
            onChange={(e) => setNewHeading(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded text-white placeholder-slate-600"
          />
        </div>

        <div className="w-full md:w-36">
          <label className="block text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">
            Level
          </label>
          <select
            value={newLevel}
            onChange={(e) => setNewLevel(Number(e.target.value))}
            className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded text-slate-200"
          >
            <option value={2}>H2 (Heading)</option>
            <option value={3}>H3 (Sub-heading)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleAddSection}
          disabled={!newHeading.trim()}
          className="w-full md:w-auto px-4 py-2.5 text-xs bg-slate-800 border border-slate-700 text-white rounded hover:bg-slate-700 hover:border-slate-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus className="h-3.5 w-3.5 text-indigo-400" />
          Add Section
        </button>
      </div>
    </div>
  );
}
