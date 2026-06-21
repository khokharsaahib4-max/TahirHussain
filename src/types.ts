export interface OutlineSection {
  heading: string;
  level: number; // 2 for H2, 3 for H3
  instructions: string;
}

export interface BlogOutline {
  title: string;
  outline: OutlineSection[];
}

export interface SavedBlog {
  id: string;
  title: string;
  topic: string;
  tone: string;
  content: string;
  createdAt: string;
  keywords?: string;
  wordCount?: number;
}
