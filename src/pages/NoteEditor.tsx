import { useParams } from 'react-router-dom';

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-text-primary">Note Editor</h1>
      <div className="text-text-secondary">
        <p>This is a placeholder for the note editor page.</p>
        <p className="mt-4">Editing note with ID: <span className="font-mono text-text-primary">{id}</span></p>
      </div>
    </div>
  );
}
