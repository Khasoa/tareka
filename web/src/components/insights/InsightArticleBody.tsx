"use client";

import type { ReactNode } from "react";

import type { TiptapMark, TiptapNode } from "@/lib/insights/document";
import { documentFromJson } from "@/lib/insights/document";
import { normalizeLinkHref } from "@/lib/insights/editor/linkHref";

function isExternalHttpLink(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function renderMarks(text: string, marks: TiptapMark[] | undefined): ReactNode {
  if (!marks?.length) return text;

  return marks.reduce<ReactNode>((content, mark) => {
    if (mark.type === "bold") {
      return <strong>{content}</strong>;
    }
    if (mark.type === "italic") {
      return <em>{content}</em>;
    }
    if (mark.type === "link") {
      const rawHref =
        typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      const href = normalizeLinkHref(rawHref);
      if (!href) {
        return <span>{content}</span>;
      }
      return (
        <a
          href={href}
          className="insight-article-link"
          rel={isExternalHttpLink(href) ? "noopener noreferrer" : undefined}
          target={isExternalHttpLink(href) ? "_blank" : undefined}
        >
          {content}
        </a>
      );
    }
    return content;
  }, text);
}

function renderInline(nodes: TiptapNode[] | undefined): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => {
    if (node.type === "hardBreak") {
      return <br key={`br-${index}`} />;
    }
    if (node.type === "text" && typeof node.text === "string") {
      return (
        <span key={`text-${index}`}>{renderMarks(node.text, node.marks)}</span>
      );
    }
    return null;
  });
}

function renderBlock(node: TiptapNode, key: string): ReactNode {
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{renderInline(node.content)}</p>;
    case "heading": {
      const level = node.attrs?.level === 3 ? 3 : 2;
      const Tag = level === 3 ? "h3" : "h2";
      return <Tag key={key}>{renderInline(node.content)}</Tag>;
    }
    case "bulletList":
      return (
        <ul key={key}>
          {node.content?.map((item, index) => renderBlock(item, `${key}-li-${index}`))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key}>
          {node.content?.map((item, index) => renderBlock(item, `${key}-li-${index}`))}
        </ol>
      );
    case "listItem":
      return <li key={key}>{node.content?.map((child, index) => renderBlock(child, `${key}-c-${index}`))}</li>;
    case "blockquote":
      return (
        <blockquote key={key}>
          {node.content?.map((child, index) => renderBlock(child, `${key}-q-${index}`))}
        </blockquote>
      );
    default:
      return null;
  }
}

type InsightArticleBodyProps = {
  bodyJson: Record<string, unknown>;
};

export function InsightArticleBody({ bodyJson }: InsightArticleBodyProps) {
  const document = documentFromJson(bodyJson);

  return (
    <article className="insight-article__prose prose mt-8 max-w-[70ch] prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-[var(--color-heading)] prose-p:leading-7 prose-p:text-[var(--color-body)] prose-strong:text-[var(--color-heading)] prose-li:leading-7">
      {document.content?.map((node, index) => renderBlock(node, `block-${index}`))}
    </article>
  );
}
