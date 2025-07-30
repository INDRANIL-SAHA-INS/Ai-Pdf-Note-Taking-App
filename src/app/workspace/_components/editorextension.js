import { AlignCenter, AlignLeft, AlignRight, Bold, Highlighter, Italic, List, Sparkle, SparkleIcon, Sparkles, Strikethrough, Underline } from 'lucide-react'
import { ListOrdered } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from "../../../../convex/_generated/api";
import { useAction } from 'convex/react';

const FONT_SIZES = ['12px', '16px', '20px', '24px', '28px', '32px']

const Editorextension = ({ editor }) => {
  const { fileId } = useParams()
  const searchAction = useAction(api.action.search)

  const CallAi = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    console.log("Selected text:", selectedText);

    // Call the search action
    try {
      const result = await searchAction({
        query: selectedText,
        fileId: fileId,
      })
      console.log("Search result:", result)
    } catch (error) {
      console.error("Search action error:", error)
    }
  }

  const [, setEditorState] = useState(0)

  useEffect(() => {
    if (!editor) return
    const update = () => setEditorState(s => s + 1)
    editor.on('update', update)
    return () => editor.off('update', update)
  }, [editor])

  // Add this guard clause
  if (!editor) return null;

  // Get current font size
  const getCurrentFontSize = () => {
    const attrs = editor.getAttributes('textStyle')
    return attrs.fontSize || '16px'
  }

  const currentSize = getCurrentFontSize()
  const currentIndex = FONT_SIZES.indexOf(currentSize)

  const increaseFontSize = () => {
    if (currentIndex < FONT_SIZES.length - 1) {
      editor.chain().focus().setFontSize(FONT_SIZES[currentIndex + 1]).run()
    }
  }

  const decreaseFontSize = () => {
    if (currentIndex > 0) {
      editor.chain().focus().setFontSize(FONT_SIZES[currentIndex - 1]).run()
    }
  }

  return (
    <div className='p-5'>
      <div className="control-group">
        <div className="button-group flex gap-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'text-blue-400' : ''}
            disabled={!editor}
          >
            <Bold className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'text-blue-500' : ''}
            disabled={!editor}
          >
            <Italic className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'text-blue-600' : ''}
            disabled={!editor}
          >
            <Underline className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'text-blue-700' : ''}
            disabled={!editor}
          >
            <Strikethrough className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'text-blue-500' : ''}
            disabled={!editor}
          >
            <AlignLeft className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'text-blue-500' : ''}
            disabled={!editor}
          >
            <AlignCenter className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'text-blue-500' : ''}
            disabled={!editor}
          >
            <AlignRight className='cursor-pointer' />
          </button>

          
          
          <button
            onClick={decreaseFontSize}
            disabled={!editor || currentIndex <= 0}
            className='cursor-pointer'
          >
            A-
          </button>
          <button
            onClick={increaseFontSize}
            disabled={!editor || currentIndex >= FONT_SIZES.length - 1}
            className='cursor-pointer'
          >
            A+
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run()}
            className={editor.isActive('highlight', { color: '#ffc078' }) ? 'is-active' : ''
          }
            disabled={!editor}
          >
            <Highlighter className='cursor-pointer' />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'text-blue-500' : ''}
            disabled={!editor}
          >
            <List className='cursor-pointer' />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'text-blue-500' : ''}
            disabled={!editor}
          >
            <ListOrdered className='cursor-pointer' />
          </button>

          <button disabled={!editor} onClick={CallAi} className='hover:text-blue-600'>
            <Sparkles className='cursor-pointer' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Editorextension
