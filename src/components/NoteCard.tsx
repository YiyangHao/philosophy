/**
 * 笔记卡片组件
 * 用于笔记列表页展示 - 自适应高度布局
 */
import { Link } from 'react-router-dom';
import type { Note } from '../types/note';

interface NoteCardProps {
  note: Note;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <Link to={`/notes/${note.id}`} className="h-full">
      <div className="h-full flex flex-col gap-3 p-5 border border-gray-200 rounded-xl bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
        {/* 标题 - 完整显示，不截断 */}
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed break-words">
          {note.title || '暂无标题'}
        </h3>

        {/* 作者 - 只有存在才显示 */}
        {note.authors && note.authors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.authors.map((author, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded"
              >
                👤 {author}
              </span>
            ))}
          </div>
        )}

        {/* 关键词 - 只有存在才显示 */}
        {note.keywords && note.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded"
              >
                🏷️ {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
