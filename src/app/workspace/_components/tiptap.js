'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { FontSize, TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'

import Editorextension from '../_components/editorextension'

const Tiptap = () => {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit,
      TextStyle,
      Underline,
      FontSize,
      BulletList.configure({ keepMarks: true, keepAttributes: true, itemTypeName: 'listItem' }),
      OrderedList,
      ListItem,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: 'Write something …',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'mx-auto focus:outline-none h-full p-4 border border-gray-300 rounded-md',
      },
    },
    immediatelyRender: false,
  })

  return (
   <div>
    <div>
      <Editorextension editor={editor} />
    </div>
     <div className="h-full">
      <EditorContent editor={editor} />
    </div>
   </div>
  )
}

export default Tiptap