/**
 * 笔记相关类型定义
 */

export interface Note {
  id: string;
  title: string;
  authors: string[] | null;  // 改为 authors 数组
  publication: string | null;
  year: number | null;
  keywords: string[];
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteFormData {
  title: string;
  authors: string[];  // 改为 authors 数组
  publication: string;
  year: number | null;
  keywords: string[];
  content: string;
}
