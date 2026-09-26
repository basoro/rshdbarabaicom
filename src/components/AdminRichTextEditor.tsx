import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Image,
  Italic,
  MonitorPlay,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
  Unlink,
} from 'lucide-react';
import RichHtml from '@/components/RichHtml';

type AdminRichTextEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {children}
    </button>
  );
}

export default function AdminRichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Tulis konten...',
  minHeightClassName = 'min-h-[22rem]',
}: AdminRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (mode !== 'visual' || !editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [mode, value]);

  function focusEditor() {
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
    });
  }

  function runCommand(command: string, commandValue?: string) {
    if (mode !== 'visual') {
      setMode('visual');
    }

    focusEditor();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  }

  function applyFormatBlock(tagName: 'h2' | 'h3' | 'blockquote' | 'p') {
    runCommand('formatBlock', tagName);
  }

  function insertLink() {
    const url = window.prompt('Masukkan URL tautan');
    if (!url) return;
    runCommand('createLink', url);
  }

  function insertImage() {
    const url = window.prompt('Masukkan URL gambar');
    if (!url) return;
    runCommand('insertImage', url);
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-white/10">
        <div>
          {label ? (
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
              {label}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Mode visual tetap menyimpan HTML, dan mode HTML memberi kontrol langsung bila diperlukan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                mode === 'visual'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={() => setMode('html')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                mode === 'html'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              HTML
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              showPreview
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <MonitorPlay className="h-4 w-4" />
            Preview Live
          </button>
        </div>
      </div>

      <div className={showPreview ? 'grid gap-px lg:grid-cols-[1fr_0.95fr]' : ''}>
        <div>
          {mode === 'visual' ? (
            <>
              <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <ToolbarButton label="Bold" onClick={() => runCommand('bold')}>
                  <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Italic" onClick={() => runCommand('italic')}>
                  <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Underline" onClick={() => runCommand('underline')}>
                  <Underline className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Heading 2" onClick={() => applyFormatBlock('h2')}>
                  <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Heading 3" onClick={() => applyFormatBlock('h3')}>
                  <Heading3 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Paragraf" onClick={() => applyFormatBlock('p')}>
                  <Code2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Quote" onClick={() => applyFormatBlock('blockquote')}>
                  <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Bullet List" onClick={() => runCommand('insertUnorderedList')}>
                  <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Numbered List" onClick={() => runCommand('insertOrderedList')}>
                  <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Tautan" onClick={insertLink}>
                  <Link2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Hapus tautan" onClick={() => runCommand('unlink')}>
                  <Unlink className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton label="Gambar" onClick={insertImage}>
                  <Image className="h-4 w-4" />
                </ToolbarButton>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(event) => onChange(event.currentTarget.innerHTML)}
                data-placeholder={placeholder}
                className={`${minHeightClassName} prose prose-invert max-w-none px-5 py-5 text-sm leading-7 text-slate-900 outline-none [&:empty:before]:pointer-events-none [&:empty:before]:text-slate-500 [&:empty:before]:content-[attr(data-placeholder)] [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_img]:rounded-2xl dark:text-white`}
              />
            </>
          ) : (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              className={`${minHeightClassName} w-full bg-transparent px-5 py-5 text-sm leading-7 text-slate-900 outline-none dark:text-white`}
            />
          )}
        </div>

        {showPreview ? (
          <div className="border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                Preview
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Tampilan ini ikut berubah saat Anda mengetik atau mengedit HTML.
              </p>
            </div>
            <RichHtml
              html={value || '<p class="text-slate-500">Preview akan muncul setelah konten diisi.</p>'}
              className={`${minHeightClassName} prose prose-invert px-5 py-5 text-sm leading-7 text-slate-700 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_img]:rounded-2xl dark:text-slate-100`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
