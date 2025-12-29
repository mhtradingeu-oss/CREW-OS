import * as React from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { cn } from "@/lib/utils";

// Custom code block styling
const CodeBlock = (props: React.HTMLAttributes<HTMLElement>) => (
  <pre className="bg-zinc-900 text-zinc-100 rounded p-4 overflow-x-auto text-sm my-4">
    <code {...props} />
  </pre>
);

const components = {
  pre: CodeBlock,
  code: (props: any) => <code className="font-mono" {...props} />,
  // Add more custom MDX components here if needed
};

interface MDXContentRendererProps {
  source: MDXRemoteSerializeResult;
}

export default function MDXContentRenderer({ source }: MDXContentRendererProps) {
  return <MDXRemote {...source} components={components} />;
}
