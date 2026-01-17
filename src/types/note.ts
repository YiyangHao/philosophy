/**
 * 笔记相关类型定义
 */

export interface Note {
  id: string;
  title: string;
  author: string | null;
  publication: string | null;
  year: number | null;
  keywords: string[];
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteFormData {
  title: string;
  author: string;
  publication: string;
  year: number | null;
  keywords: string[];
  content: string;
}
