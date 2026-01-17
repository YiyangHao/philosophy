/**
 * 笔记元数据面板组件
 * 可折叠的元数据输入区域
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from './ui/input';
import TagInput from './TagInput';

interface NoteMetadataPanelProps {
  authors: string[];  // 改为 authors 数组
  publication: string;
  year: number | null;
  keywords: string[];
  onAuthorsChange: (value: string[]) => void;  // 改为接收数组
  onPublicationChange: (value: string) => void;
  onYearChange: (value: number | null) => void;
  onKeywordsChange: (keywords: string[]) => void;
}

export default function NoteMetadataPanel({
  authors,  // 改为 authors
  publication,
  year,
  keywords,
  onAuthorsChange,  // 改为 onAuthorsChange
  onPublicationChange,
  onYearChange,
  onKeywordsChange,
}: NoteMetadataPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg px-4 py-3 mb-6">
      {/* 面板内容 */}
      {isOpen && (
        <div className="space-y-4">
          {/* 作者 - 使用 TagInput，支持多作者 */}
          <TagInput
            type="author"
            value={authors}  // 直接传递数组
            onChange={onAuthorsChange}  // 直接接收数组
            placeholder="输入作者姓名..."
          />

          {/* 出版物 */}
          <div>
            <label className="text-sm text-[#8E8E93] mb-1 block">📚 出版物</label>
            <Input
              value={publication}
              onChange={(e) => onPublicationChange(e.target.value)}
              placeholder="例如：Noûs, Vol. 4, No. 1"
              className="bg-white"
            />
          </div>

          {/* 年份 */}
          <div>
            <label className="text-sm text-[#8E8E93] mb-1 block">📅 年份</label>
            <Input
              type="number"
              value={year || ''}
              onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="例如：1970"
              className="bg-white"
            />
          </div>

          {/* 关键词 - 使用 TagInput */}
          <TagInput
            type="keyword"
            value={keywords}
            onChange={onKeywordsChange}
            placeholder="输入关键词..."
          />
        </div>
      )}

      {/* 折叠按钮移到底部 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full mt-3"
      >
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#8E8E93]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8E8E93]" />
        )}
      </button>
    </div>
  );
}
