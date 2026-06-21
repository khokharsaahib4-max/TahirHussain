import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-slate-400 italic">No content generated yet.</p>;
  }

  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = (key: number) => {
    if (!currentList) return null;
    const list = currentList;
    currentList = null;

    if (list.type === "ul") {
      return (
        <ul key={`list-${key}`} className="list-disc pl-6 mb-5 space-y-2 text-slate-300 text-base md:text-lg font-serif">
          {list.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: parseInlines(item) }} />
          ))}
        </ul>
      );
    } else {
      return (
        <ol key={`list-${key}`} className="list-decimal pl-6 mb-5 space-y-2 text-slate-300 text-base md:text-lg font-serif">
          {list.items.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: parseInlines(item) }} />
          ))}
        </ol>
      );
    }
  };

  const parseInlines = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-900/80 text-amber-300 font-mono text-sm px-1.5 py-0.5 rounded border border-slate-800">$1</code>');
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const line = rawLine.trim();

    // Handle blockquotes
    if (line.startsWith(">")) {
      if (currentList) {
        const component = flushList(idx);
        if (component) renderedElements.push(component);
      }
      const quoteText = line.replace(/^>\s*/, "");
      renderedElements.push(
        <blockquote key={idx} className="border-l-4 border-amber-500 bg-amber-500/5 my-5 px-5 py-3 rounded-r-lg italic text-slate-200">
          <p className="m-0" dangerouslySetInnerHTML={{ __html: parseInlines(quoteText) }} />
        </blockquote>
      );
      continue;
    }

    // Handle bullet lists
    if (line.startsWith("* ") || line.startsWith("- ")) {
      if (currentList && currentList.type !== "ul") {
        const component = flushList(idx);
        if (component) renderedElements.push(component);
      }
      const itemText = line.replace(/^[\*\-]\s+/, "");
      if (!currentList) {
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Handle numbered lists
    if (/^\d+\.\s+/.test(line)) {
      if (currentList && currentList.type !== "ol") {
        const component = flushList(idx);
        if (component) renderedElements.push(component);
      }
      const itemText = line.replace(/^\d+\.\s+/, "");
      if (!currentList) {
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Flush active lists if reaching a non-list item
    if (currentList) {
      const component = flushList(idx);
      if (component) renderedElements.push(component);
    }

    if (line === "") {
      // Small spacing element
      renderedElements.push(<div key={`blank-${idx}`} className="h-2" />);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      const hText = line.replace(/^#\s*/, "");
      renderedElements.push(
        <h1 key={idx} className="text-3xl md:text-4xl font-serif font-bold text-white mt-8 mb-5 leading-tight border-b border-slate-800 pb-3">
          {hText}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      const hText = line.replace(/^##\s*/, "");
      renderedElements.push(
        <h2 key={idx} className="text-2xl md:text-3xl font-serif font-semibold text-indigo-300 mt-10 mb-4 tracking-tight">
          {hText}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      const hText = line.replace(/^###\s*/, "");
      renderedElements.push(
        <h3 key={idx} className="text-xl md:text-2xl font-serif font-medium text-slate-200 mt-7 mb-3 tracking-tight">
          {hText}
        </h3>
      );
    } else {
      // Paragraph
      renderedElements.push(
        <p key={idx} className="text-slate-300 font-serif leading-relaxed mb-6 text-base md:text-lg" dangerouslySetInnerHTML={{ __html: parseInlines(line) }} />
      );
    }
  }

  // Flush remaining lists
  if (currentList) {
    const component = flushList(lines.length);
    if (component) renderedElements.push(component);
  }

  return <div className="prose prose-invert max-w-none">{renderedElements}</div>;
}
