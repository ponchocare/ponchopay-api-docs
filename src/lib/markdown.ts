import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { rehypeBaseLinks } from '../../plugins/rehype-base-links.mjs';

type Processor = Awaited<ReturnType<typeof createMarkdownProcessor>>;

let processor: Promise<Processor> | undefined;

/** Renders a short Markdown string (a field description) to HTML, with base-aware links. */
export async function renderMarkdown(markdown: string): Promise<string> {
  processor ??= createMarkdownProcessor({
    syntaxHighlight: false,
    rehypePlugins: [[rehypeBaseLinks, { base: import.meta.env.BASE_URL }]],
  });
  const { code } = await (await processor).render(markdown);
  return code;
}
