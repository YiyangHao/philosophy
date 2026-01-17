/**
 * 笔记卡片组件
 * 用于笔记列表页展示
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Note } from '../types/note';

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link to={`/notes/${note.id}`}>
      <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#1C1C1E]">
            {note.title || '无标题'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {note.author && (
            <p className="text-sm text-[#8E8E93]">{note.author}</p>
          )}
          <p className="text-xs text-[#8E8E93]">
            {formatDate(note.created_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
