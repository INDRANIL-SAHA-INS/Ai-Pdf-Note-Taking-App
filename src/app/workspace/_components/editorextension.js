import { AlignCenter, AlignLeft, AlignRight, Bold, Highlighter, Italic, List, Sparkle, SparkleIcon, Sparkles, Strikethrough, Underline } from 'lucide-react'
import { ListOrdered } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from "../../../../convex/_generated/api";
import { useAction, useMutation, useQuery } from 'convex/react';
import { toast } from "sonner"
import { Toaster } from "sonner"
import { useUser } from '@clerk/nextjs';

const FONT_SIZES = ['12px', '16px', '20px', '24px', '28px', '32px']


const Editorextension = ({ editor }) => {
  const { fileId } = useParams();
  const { user } = useUser();
  const searchAction = useAction(api.action.search);
  const saveEditorContent = useMutation(api.editordata.upsertEditorData);
  // Fetch existing editor data for this fileId
  const existingEditorData = useQuery(
    api.editordata.getEditorDataByFileId,
    fileId ? { fileId } : "skip"
  );

  const CallAi = async () => {

    toast("Ai is getting your answer...", {
      position: "top-right",
      style: {
        background: "#1e293b",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "1rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: "16px 24px"
      }
    })

  if (!editor) return;
  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to, ' ');
  console.log("Selected text:", selectedText);

  try {
    const result = await searchAction({
      query: selectedText,
      fileId: fileId,
    });

    const prompt = `Based solely on the following context: ${result}. Please answer the query: "${selectedText}". Provide the answer in HTML format and include the source of the information.`;
    const groqResponse = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        model: "llama-3.3-70b-versatile"
      })
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();

    if (groqData.error) {
      throw new Error(`Groq API error: ${groqData.error}`);
    }

    console.log("Groq output:", groqData.content);
    // Append new answer to the end of existing editor content, on a new line
    if (editor && typeof groqData.content === "string") {
      const currentHtml = editor.getHTML();
      const answerHtml = `<p><strong>Answer: </strong> ${groqData.content}</p>`;
      // If editor is empty, just set the answer
      if (!currentHtml || currentHtml === '<p></p>') {
        editor.commands.setContent(answerHtml, false, { parseOptions: { preserveWhitespace: true } });
      } else {
        // Otherwise, append the answer after existing content
        // Remove trailing </p> if present to avoid double breaks
        const newHtml = currentHtml.endsWith('</p>')
          ? currentHtml + answerHtml
          : currentHtml + '<br />' + answerHtml;
        editor.commands.setContent(newHtml, false, { parseOptions: { preserveWhitespace: true } });
      }
    }
    return groqData.content;
      
  } catch (error) {
    console.error("Error:", error);
  }
}
// Update editor state on every change
  const [, setEditorState] = useState(0)


  // Set initial content from DB if available (only once, when editor and data are ready)
  useEffect(() => {
    if (!editor || !existingEditorData) return;
    // Only set if editor is empty
    const currentHtml = editor.getHTML();
    if ((currentHtml === '' || currentHtml === '<p></p>') && existingEditorData.data) {
      editor.commands.setContent(existingEditorData.data, false, { parseOptions: { preserveWhitespace: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, existingEditorData]);

  // Auto-save editor content to Convex on every change (debounced)
  useEffect(() => {
    if (!editor) return;
    let timeout;
    const saveContent = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveEditorContent({
          fileId,
          createdBy: user?.primaryEmailAddress?.emailAddress || "unknown_user",
          data: editor.getHTML(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }, 1000); // 1 second debounce
    };
    editor.on('update', saveContent);
    return () => {
      editor.off('update', saveContent);
      clearTimeout(timeout);
    };
  }, [editor, fileId, saveEditorContent, user?.primaryEmailAddress?.emailAddress]);

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
    <div>
      <Toaster richColors position="top-right" />
      <div className='p-5  mb-4'>
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
              className={editor.isActive('highlight', { color: '#ffc078' }) ? 'is-active' : ''}
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
    </div>
  )
}

export default Editorextension
