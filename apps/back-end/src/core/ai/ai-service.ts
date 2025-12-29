declare const openai: {
  chat: {
    completions: {
      create(args: { model: string; messages: { role: string; content: string }[] }): Promise<unknown>;
    };
  };
};

export const AIService = {
  async run(model: string, prompt: string) {
    if (process.env.AI_PROVIDER === "ollama") {
      return await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        body: JSON.stringify({ model, prompt }),
      }).then(res => res.json());
    }

    // OpenAI mode
    return openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
  }
};
