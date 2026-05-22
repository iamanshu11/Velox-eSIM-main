'use client';

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Minus,
  Undo,
  Redo,
  Code,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const TOOLBAR_BTN =
  'p-1.5 rounded text-gray-600 hover:bg-neutral-100 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

const ACTIVE_BTN =
  'p-1.5 rounded bg-neutral-200 text-gray-900';

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Write your email content here...',
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[280px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm text-gray-900 focus:outline-none prose prose-sm max-w-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const toolbarGroups = [
    [
      { icon: Undo, action: () => editor.chain().focus().undo().run(), title: 'Undo', disabled: !editor.can().undo() },
      { icon: Redo, action: () => editor.chain().focus().redo().run(), title: 'Redo', disabled: !editor.can().redo() },
    ],
    [
      { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), title: 'Bold', active: editor.isActive('bold') },
      { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), title: 'Italic', active: editor.isActive('italic') },
      { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), title: 'Underline', active: editor.isActive('underline') },
      { icon: Code, action: () => editor.chain().focus().toggleCode().run(), title: 'Inline code', active: editor.isActive('code') },
    ],
    [
      { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), title: 'Align left', active: editor.isActive({ textAlign: 'left' }) },
      { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), title: 'Align center', active: editor.isActive({ textAlign: 'center' }) },
      { icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), title: 'Align right', active: editor.isActive({ textAlign: 'right' }) },
      { icon: AlignJustify, action: () => editor.chain().focus().setTextAlign('justify').run(), title: 'Justify', active: editor.isActive({ textAlign: 'justify' }) },
    ],
    [
      { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), title: 'Bullet list', active: editor.isActive('bulletList') },
      { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), title: 'Ordered list', active: editor.isActive('orderedList') },
      { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), title: 'Horizontal rule' },
    ],
    [
      { icon: LinkIcon, action: setLink, title: 'Set link', active: editor.isActive('link') },
    ],
  ];

  return (
    <div className={`border rounded-lg overflow-hidden bg-white border-neutral-200 focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 bg-neutral-50">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <span className="w-px h-5 bg-neutral-300 mx-1" />
            )}
            {group.map(({ icon: Icon, action, title, active, disabled: btnDisabled } : any) => (
              <button
                key={title}
                type="button"
                onClick={action}
                title={title}
                disabled={!!btnDisabled}
                className={active ? ACTIVE_BTN : TOOLBAR_BTN}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </React.Fragment>
        ))}

        {/* Heading select */}
        <span className="w-px h-5 bg-neutral-300 mx-1" />
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
            }
          }}
          value={
            editor.isActive('heading', { level: 1 })
              ? '1'
              : editor.isActive('heading', { level: 2 })
              ? '2'
              : editor.isActive('heading', { level: 3 })
              ? '3'
              : '0'
          }
          className="text-xs px-2 py-1 rounded border border-neutral-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Variable hint */}
      <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50">
        <p className="text-xs text-gray-500">
          Variables: {`{{userName}}`} {`{{userEmail}}`} {`{{purchaseCount}}`} {`{{lastPurchaseDate}}`} {`{{currentDate}}`}
        </p>
      </div>
    </div>
  );
}
