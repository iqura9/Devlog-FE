import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

/**
 * Renders LLM markdown output with sensible prose styling.
 * Keeps it lightweight — no full typography reset, just enough for headings, lists, code.
 */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("text-[13.5px] leading-relaxed text-foreground/85", className)}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-2 mt-4 text-[15px] font-bold tracking-tight first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-1.5 mt-3 text-[14px] font-bold tracking-tight first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-2.5 text-[13px] font-semibold first:mt-0">{children}</h3>
        ),
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block rounded-md bg-muted px-3 py-2 font-mono text-[12px]">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11.5px]">{children}</code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-md bg-muted p-3 last:mb-0">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-primary/40 pl-3 text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
