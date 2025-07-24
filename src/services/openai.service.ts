import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4.1-nano') {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.model = model;
  }

  async *streamChatCompletion(
    messages: ChatCompletionMessageParam[],
    onError?: (error: Error) => void
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Unknown error occurred');
      if (onError) {
        onError(errorMessage);
      } else {
        throw errorMessage;
      }
    }
  }

  createContextMessages(
    userMessage: string,
    fileContent?: string,
    fileName?: string
  ): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant helping to edit markdown files. Provide clear, concise suggestions and improvements.'
      }
    ];

    if (fileContent && fileName) {
      messages.push({
        role: 'system',
        content: `The user is currently editing a markdown file named "${fileName}". Here is the current content of the file:\n\n${fileContent}`
      });
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }
}