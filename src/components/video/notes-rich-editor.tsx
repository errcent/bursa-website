"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BUBBLE_MENU_DELAY_MS = 400;

interface NotesRichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeightClass?: string;
  autofocus?: boolean;
  /** Fixed toolbar — off by default; formatting via bubble menu + keyboard shortcuts */
  showToolbar?: boolean;
  ariaLabel?: string;
  onBlur?: () => void;
}

function ToolbarButton({
  active,
  onClick,
  label,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-foreground/10 text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />;
}

function BubbleToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-popover-foreground/80 transition-colors hover:bg-muted hover:text-popover-foreground",
        active && "bg-foreground/10 text-popover-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SelectionBubbleMenu({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleSelectionUpdate = () => {
      const { empty } = editor.state.selection;
      clearTimer();

      if (empty) {
        setVisible(false);
        return;
      }

      timerRef.current = setTimeout(() => {
        const { empty: stillEmpty } = editor.state.selection;
        setVisible(!stillEmpty);
      }, BUBBLE_MENU_DELAY_MS);
    };

    const handleBlur = () => {
      clearTimer();
      setVisible(false);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("blur", handleBlur);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("blur", handleBlur);
      clearTimer();
    };
  }, [editor]);

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={() => visible}
      options={{
        offset: 8,
        placement: "top",
      }}
    >
      <div
        role="toolbar"
        aria-label="Format teks terpilih"
        className="flex items-center gap-0.5 rounded-xl border border-border bg-popover px-1 py-1 shadow-lg"
      >
        <BubbleToolbarButton
          label="Tebal (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </BubbleToolbarButton>
        <BubbleToolbarButton
          label="Miring (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </BubbleToolbarButton>
        <BubbleToolbarButton
          label="Garis bawah (Ctrl+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </BubbleToolbarButton>
        <BubbleToolbarButton
          label="Coret"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-3.5" />
        </BubbleToolbarButton>
        <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />
        <BubbleToolbarButton
          label="Daftar"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </BubbleToolbarButton>
        <BubbleToolbarButton
          label="Daftar bernomor"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </BubbleToolbarButton>
        <BubbleToolbarButton
          label="Tautan"
          active={editor.isActive("link")}
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            const previous = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("URL tautan", previous ?? "https://");
            if (!url) return;
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          <Link2 className="size-3.5" />
        </BubbleToolbarButton>
      </div>
    </BubbleMenu>
  );
}

function FixedToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
      <ToolbarButton
        label="Judul"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Subjudul"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-3.5" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Tebal"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Miring"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Garis bawah"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Coret"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Daftar"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Daftar bernomor"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Kutipan"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Tautan"
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const previous = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("URL tautan", previous ?? "https://");
          if (!url) return;
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        <Link2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton
        label="Urungkan"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Ulangi"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" />
      </ToolbarButton>
      <div className="ml-auto hidden sm:block">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-muted-foreground"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          Reset format
        </Button>
      </div>
    </div>
  );
}

export function NotesRichEditor({
  content,
  onChange,
  placeholder = "Tulis catatan seperti dokumen…",
  editable = true,
  className,
  minHeightClass = "min-h-[120px]",
  autofocus = false,
  showToolbar = false,
  ariaLabel,
  onBlur,
}: NotesRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    editable,
    autofocus: autofocus ? "end" : false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose-notes outline-none",
          minHeightClass,
          "px-3 py-2.5 text-sm leading-relaxed text-foreground"
        ),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      },
      handleDOMEvents: {
        blur: () => {
          onBlur?.();
          return false;
        },
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-surface",
          minHeightClass,
          className
        )}
      />
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      {editable && showToolbar && <FixedToolbar editor={editor} />}
      <EditorContent editor={editor} />
      {editable && !showToolbar && <SelectionBubbleMenu editor={editor} />}
    </div>
  );
}
