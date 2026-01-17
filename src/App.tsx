import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NotesListPage from './pages/NotesListPage';
import NoteDetailPage from './pages/NoteDetailPage';
import NoteEditorPage from './pages/NoteEditorPage';
import SearchResultsPage from './pages/SearchResultsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 笔记列表页（首页） */}
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/notes" element={<NotesListPage />} />
        
        {/* 新建笔记 */}
        <Route path="/notes/new" element={<NoteEditorPage />} />
        
        {/* 笔记详情页 */}
        <Route path="/notes/:id" element={<NoteDetailPage />} />
        
        {/* 编辑笔记 */}
        <Route path="/notes/:id/edit" element={<NoteEditorPage />} />
        
        {/* 搜索结果页 */}
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
