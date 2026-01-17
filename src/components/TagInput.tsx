/**
 * 通用 Tag 输入组件
 * 支持作者和关键词两种类型
 */
import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  type: 'author' | 'keyword';
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({
  type,
  value,
  onChange,
  placeholder = '输入后按 Enter 或逗号添加...'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  // 添加 Tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    // 验证：不能为空，不能重复
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) {
      setInputValue('');
      return;
    }

    // 添加到数组（作者和关键词都支持多个）
    onChange([...value, trimmedTag]);

    setInputValue('');
  };

  // 删除 Tag
  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter 键：添加 Tag
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
    
    // Backspace 键：如果输入框为空，删除最后一个 Tag
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  // 处理输入变化（检测逗号）
  const handleInputChange = (newValue: string) => {
    // 如果输入了逗号，添加 Tag
    if (newValue.includes(',')) {
      const tags = newValue.split(',').filter(t => t.trim());
      tags.forEach(tag => addTag(tag));
      return;
    }

    setInputValue(newValue);
  };

  // 获取类型特定的配置
  const getTypeConfig = () => {
    switch (type) {
      case 'author':
        return {
          label: '作者',
          icon: '👤',
          maxTags: Infinity, // 支持多个作者
        };
      case 'keyword':
        return {
          label: '关键词',
          icon: '🏷️',
          maxTags: Infinity, // 支持多个关键词
        };
    }
  };

  const config = getTypeConfig();
  const canAddMore = value.length < config.maxTags;

  return (
    <div className="space-y-2">
      {/* 标签 */}
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </label>

      {/* 输入区域 */}
      <div className="flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {/* 已有的 Tags */}
        {value.map((tag, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-[#E5F1FF] text-[#1F2937] rounded-md text-sm font-medium"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-red-600 transition-colors"
              aria-label={`删除 ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* 输入框 */}
        {canAddMore && (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          />
        )}
      </div>

      {/* 提示文本 */}
      <p className="text-xs text-gray-500">
        按 Enter 或输入逗号添加，Backspace 删除
      </p>
    </div>
  );
}
