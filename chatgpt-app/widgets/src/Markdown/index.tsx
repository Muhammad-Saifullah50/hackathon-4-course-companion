import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  content: string;
  compact?: boolean;
}

const components: Components = {
  a({ href, children, ...props }) {
    const external = isExternalLink(href);
    return (
      <a
        {...props}
        href={href}
        rel={external ? "noreferrer noopener" : undefined}
        target={external ? "_blank" : undefined}
      >
        {children}
      </a>
    );
  },
};

export function Markdown({ content, compact = false }: MarkdownProps) {
  return (
    <div className={compact ? "markdown markdown-compact" : "markdown"}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function isExternalLink(href: string | undefined): boolean {
  return /^https?:\/\//i.test(href ?? "");
}
