import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "@/components/code-block";
import { slugifyHeading, stripFirstHeading } from "@/lib/markdown";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <article className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 id={slugifyHeading(String(children))}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 id={slugifyHeading(String(children))}>{children}</h3>
          ),
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined}>
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className ?? "");
            const code = String(children).replace(/\n$/, "");
            return match ? (
              <CodeBlock code={code} language={match[1]} />
            ) : (
              <code>{children}</code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {stripFirstHeading(content)}
      </ReactMarkdown>
    </article>
  );
}
