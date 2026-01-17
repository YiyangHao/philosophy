/**
 * 笔记元数据面板组件
 * 可折叠的元数据输入区域
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface NoteMetadataPanelProps {
  author: string;
  publication: string;
  year: number | null;
  keywords: string[];
  onAuthorChange: (value: string) => void;
  onPublicationChange: (value: string) => void;
  onYearChange: (value: number | null) => void;
  onKeywordsChange: (keywords: string[]) => void;
}

export default function NoteMetadataPanel({
  author,
  publication,
  year,
  keywords,
  onAuthorChange,
  onPublicationChange,
  onYearChange,
  onKeywordsChange,
}: NoteMetadataPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');

  // 添加关键词
  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !keywords.includes(keyword)) {
      onKeywordsChange([...keywords, keyword]);
      setKeywordInput('');
    }
  };

  // 删除关键词
  const handleRemoveKeyword = (index: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== index));
  };

  // 处理关键词输入框回车
  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4 mb-6">
      {/* 面板头部 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left mb-4"
      >
        <span className="text-sm font-medium text-[#1C1C1E]">📚 元数据</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#8E8E93]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#8E8E93]" />
        )}
      </button>

      {/* 面板内容 */}
      {isOpen && (
        <div className="space-y-4">
          {/* 作者 */}
          <div>
            <label className="text-sm text-[#8E8E93] mb-1 block">作者</label>
            <Input
              value={author}
              onChange={(e) => onAuthorChange(e.target.value)}
              placeholder="例如：Thomas Nagel"
              className="bg-white"
            />
          </div>

          {/* 出版物 */}
          <div>
            <label className="text-sm text-[#8E8E93] mb-1 block">出版物</label>
            <Input
              value={publication}
              onChange={(e) => onPublicationChange(e.target.value)}
              placeholder="例如：Noûs, Vol. 4, No. 1"
              className="bg-white"
            />
          </div>

          {/* 年份 */}
          <div>
            <label className="text-sm text-[#8E8E93] mb-1 block">年份</label>
            <Input
              type="number"
              value={year || ''}
              onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="例如：1970"
              className="bg-white"
            />
          </div>

          {/* 关键词 */}
          <div>
            <label className="text-sm text-[#8E8E93] mb-1 block">
              关键词（按回车添加）
            </label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                placeholder="输入关键词后按回车"
                className="bg-white"
              />
              <Button
                type="button"
                onClick={handleAddKeyword}
                variant="outline"
                size="sm"
              >
                添加
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
