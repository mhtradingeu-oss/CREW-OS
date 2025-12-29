"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModulePageLayout, type TableRow } from "@/components/shell/module-page";
import { FilterBar } from "@/components/shell/filter-bar";
import { cn } from "@/lib/utils";

const CONTROL_BUTTONS = [
  { id: "underperformers", label: "Find Underperforming Products" },
  { id: "pricing", label: "Suggest Price Optimizations" },
  { id: "low-stock", label: "Highlight Low Stock" },
] as const;

const COMMERCE_AI_TEMPLATE = [
  "AI Commerce suggests bundling Super Serum with Night Reset.",
  "Catalog intelligence recommends 3% lift on Stand Focus price.",
  "Recommend restocking Dubai Mall before the weekend.",
];

type CommerceControlId = (typeof CONTROL_BUTTONS)[number]["id"];

type ProductStatus = "Active" | "Archived";
type StockStatus = "Low" | "OK";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  stockStatus: StockStatus;
  createdAt: string;
};

type AiMessage = { id: string; role: "user" | "ai"; message: string };

type CommerceSuggestion = {
  id: string;
  title: string;
  detail: string;
  targets: string[];
  applied: boolean;
  effect: (product: Product) => Product;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: "super-serum", name: "Super Serum", category: "Skincare", price: 135, status: "Active", stockStatus: "OK", createdAt: "Mar 18" },
  { id: "night-reset", name: "Night Reset Gel", category: "Skincare", price: 78, status: "Active", stockStatus: "Low", createdAt: "Mar 10" },
  { id: "stand-focus", name: "Stand Focus Kit", category: "Field", price: 214, status: "Active", stockStatus: "Low", createdAt: "Feb 22" },
  { id: "nova-lotion", name: "Nova Lotion", category: "Growth", price: 98, status: "Active", stockStatus: "OK", createdAt: "Mar 05" },
  { id: "orbit-veil", name: "Orbit Veil", category: "Skincare", price: 122, status: "Archived", stockStatus: "OK", createdAt: "Jan 28" },
  { id: "halo-powder", name: "Halo Powder", category: "Commerce", price: 67, status: "Active", stockStatus: "Low", createdAt: "Mar 01" },
  { id: "azure-cream", name: "Azure Cream", category: "Growth", price: 89, status: "Archived", stockStatus: "OK", createdAt: "Feb 12" },
  { id: "field-mist", name: "Field Mist", category: "Field", price: 54, status: "Active", stockStatus: "OK", createdAt: "Mar 20" },
];

const INITIAL_SUGGESTIONS: CommerceSuggestion[] = [
  {
    id: "price-serum",
    title: "Raise Super Serum price +5%",
    detail: "Margin intelligence suggests this lift for premium channels.",
    targets: ["super-serum"],
    applied: false,
    effect: (product) =>
      product.id === "super-serum"
        ? { ...product, price: Math.round(product.price * 1.05) }
        : product,
  },
  {
    id: "restock-night",
    title: "Restock Night Reset",
    detail: "Low stock stand kit needs immediate refill.",
    targets: ["night-reset", "stand-focus"],
    applied: false,
    effect: (product) =>
      product.stockStatus === "Low" ? { ...product, stockStatus: "OK" } : product,
  },
  {
    id: "bundle-field",
    title: "Bundle Field Mist + Stand Focus",
    detail: "Suggest upsell for field teams to drive revenue per hour.",
    targets: ["field-mist", "stand-focus"],
    applied: false,
    effect: (product) => ({ ...product }),
  },
];

export default function CommerceProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "All">("All");
  const [stockFilter, setStockFilter] = useState<StockStatus | "All">("All");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [aiFocus, setAiFocus] = useState("Commerce AI ready");
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [highlightLowStock, setHighlightLowStock] = useState(false);
  const [suggestions, setSuggestions] = useState<CommerceSuggestion[]>(INITIAL_SUGGESTIONS);
  const [conversation, setConversation] = useState<AiMessage[]>([
    { id: "comm-ai", role: "ai", message: "Product Brain is evaluating prestine SKUs." },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiResponseIndex, setAiResponseIndex] = useState(0);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((product) => (statusFilter === "All" ? true : product.status === statusFilter))
      .filter((product) => (stockFilter === "All" ? true : product.stockStatus === stockFilter))
      .sort((a, b) => {
        if (!sortDirection) return 0;
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      });
  }, [products, searchTerm, statusFilter, stockFilter, sortDirection]);

  const tableRows: TableRow[] = filteredProducts.map((product) => [
    <div key={`${product.id}-name`} className="space-y-1">
      <p className="text-white">{product.name}</p>
      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{product.category}</p>
      {highlightedProductId === product.id && (
        <span className="text-[0.65rem] text-amber-300">AI focus</span>
      )}
    </div>,
    product.category,
    `$${product.price.toFixed(2)}`,
    product.status,
    <span
      key={`${product.id}-stock`}
      className={cn(highlightLowStock && product.stockStatus === "Low" ? "text-amber-300" : "text-slate-200")}
    >
      {product.stockStatus}
    </span>,
    product.createdAt,
  ]);

  function handleControlAction(id: CommerceControlId) {
    if (id === "underperformers") {
      setStatusFilter("Active");
      setStockFilter("All");
      setSearchTerm("");
      const candidate = [...products].sort((a, b) => a.price - b.price)[0];
      setHighlightedProductId(candidate?.id ?? null);
      setHighlightLowStock(false);
      setAiFocus("Underperformers highlighted for review");
    }
    if (id === "pricing") {
      setHighlightLowStock(false);
      setHighlightedProductId(null);
      setAiFocus("Pricing intelligence queued");
    }
    if (id === "low-stock") {
      setStockFilter("Low");
      setHighlightLowStock(true);
      setHighlightedProductId(null);
      setAiFocus("Low-stock rows highlighted");
    }
  }

  function toggleSort() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function markSuggestionApplied(id: string) {
    setSuggestions((prev) => {
      const suggestion = prev.find((item) => item.id === id);
      if (!suggestion || suggestion.applied) return prev;
      setProducts((current) => current.map((product) => (suggestion.targets.includes(product.id) ? suggestion.effect(product) : product)));
      return prev.map((item) => (item.id === id ? { ...item, applied: true } : item));
    });
    setAiFocus("Applied AI suggestion");
  }

  function handleAskAi() {
    const trimmed = aiInput.trim();
    if (!trimmed) return;
    const aiReply: string =
      COMMERCE_AI_TEMPLATE[aiResponseIndex % COMMERCE_AI_TEMPLATE.length] ??
      COMMERCE_AI_TEMPLATE[0]!;
    setConversation((prev) => [
      ...prev,
      { id: `user-${prev.length}`, role: "user", message: trimmed },
      {
        id: `ai-${prev.length}`,
        role: "ai",
        message: aiReply,
      },
    ]);
    setAiResponseIndex((prev) => prev + 1);
    setAiInput("");
  }

  const controlStrip = (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
      {CONTROL_BUTTONS.map((control) => (
        <Button key={control.id} size="sm" variant="ghost" onClick={() => handleControlAction(control.id)}>
          {control.label}
        </Button>
      ))}
      <span className="ml-auto text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
        {aiFocus}
      </span>
    </div>
  );

  const filters = (
    <FilterBar className="flex-col gap-3">
      <Input
        placeholder="Search product name..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="max-w-lg bg-slate-900/70 text-sm text-white"
      />
      <div className="flex flex-wrap gap-2">
        {(["All", "Active", "Archived"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={statusFilter === status ? "secondary" : "ghost"}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["All", "Low", "OK"] as const).map((stock) => (
          <Button
            key={stock}
            size="sm"
            variant={stockFilter === stock ? "secondary" : "ghost"}
            onClick={() => setStockFilter(stock)}
          >
            {stock}
          </Button>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={toggleSort}>
        Sort by price {sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : ""}
      </Button>
    </FilterBar>
  );

  return (
    <ModulePageLayout
      title="Commerce · Products"
      description="AI intelligence that keeps the master catalog, pricing, and inventory aligned."
      meta="Mock data / TODO AI signals"
      actions={<Button variant="outline">Export catalog</Button>}
      controlStrip={controlStrip}
      kpis={[
        { title: "Total products", value: products.length.toString(), hint: "Catalog" },
        { title: "Active products", value: products.filter((item) => item.status === "Active").length.toString(), hint: "Live" },
        { title: "Low stock %", value: `${Math.round((products.filter((item) => item.stockStatus === "Low").length / products.length) * 100)}%`, hint: "Risk" },
        { title: "Avg price", value: `$${(products.reduce((sum, item) => sum + item.price, 0) / products.length).toFixed(2)}`, hint: "Across catalog" },
      ]}
      table={{
        title: "Products overview",
        description: "Search, sort, and filter the catalog before automations deploy updates.",
        columns: ["Name", "Category", "Price", "Status", "Stock", "Created"],
        rows: tableRows,
        filters,
      }}
      aiInsights={{
        title: "AI Commerce Crew",
        description: "Suggestions powered by the Commerce Brain and Virtual HQ inputs.",
        items: [],
      }}
      aiPanel={
        <CommerceAiPanel
          suggestions={suggestions}
          onApplySuggestion={markSuggestionApplied}
          conversation={conversation}
          aiInput={aiInput}
          onAiInputChange={setAiInput}
          onAskAi={handleAskAi}
          aiFocus={aiFocus}
        />
      }
    />
  );
}

function CommerceAiPanel({
  suggestions,
  onApplySuggestion,
  conversation,
  aiInput,
  onAiInputChange,
  onAskAi,
  aiFocus,
}: {
  suggestions: CommerceSuggestion[];
  onApplySuggestion: (id: string) => void;
  conversation: AiMessage[];
  aiInput: string;
  onAiInputChange: (value: string) => void;
  onAskAi: () => void;
  aiFocus: string;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              "space-y-2 rounded-2xl border border-white/10 p-4",
              suggestion.applied ? "bg-slate-900/50" : "bg-slate-950/70",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{suggestion.title}</p>
              <span className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
                {suggestion.applied ? "Applied" : "Pending"}
              </span>
            </div>
            <p className="text-xs text-slate-400">{suggestion.detail}</p>
            <Button
              size="sm"
              variant="ghost"
              disabled={suggestion.applied}
              onClick={() => onApplySuggestion(suggestion.id)}
            >
              {suggestion.applied ? "Applied" : "Apply suggestion"}
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Catalog Chat</p>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">{aiFocus}</p>
        </div>
        <div className="flex flex-col gap-3 max-h-40 overflow-y-auto">
          {conversation.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-xl p-3 text-sm",
                message.role === "user" ? "bg-white/10 text-white" : "bg-slate-950/60 text-slate-200",
              )}
            >
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
                {message.role === "user" ? "You" : "AI"}
              </p>
              <p>{message.message}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <textarea
            value={aiInput}
            onChange={(event) => onAiInputChange(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-sm text-white placeholder:text-slate-500 focus:border-primary"
            placeholder="Ask AI about this catalog, pricing, or growth levers..."
          />
          <div className="flex items-center justify-between">
            <Button size="sm" variant="secondary" onClick={onAskAi}>
              Ask AI
            </Button>
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-500">Virtual HQ · TODO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
