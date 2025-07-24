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

  async analyzeDocumentUpdate(
    chatHistory: ChatCompletionMessageParam[],
    currentDocument: string
  ): Promise<{ oldContent: string; newContent: string } | null> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are analyzing a conversation about a markdown document to determine what changes should be applied.
          
Your task:
1. Review the conversation history
2. Identify the specific section of the document that needs to be updated
3. Return a JSON object with the exact text to find and replace

Important:
- The oldContent should be the EXACT text from the current document (including formatting, line breaks, etc.)
- The newContent should be the updated version based on the conversation
- If you cannot identify a specific section to update, return null

Current document content:
${currentDocument}`
        },
        ...chatHistory,
        {
          role: 'user',
          content: 'Based on our conversation, please identify what section of the document should be updated. Return a JSON object with "oldContent" (exact text to replace) and "newContent" (updated text). If no specific section can be identified, return null.'
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.3, // Lower temperature for more consistent JSON
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return null;

      try {
        const parsed = JSON.parse(response);
        if (parsed.oldContent && parsed.newContent) {
          return {
            oldContent: parsed.oldContent,
            newContent: parsed.newContent
          };
        }
        return null;
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Error analyzing document update:', error);
      throw error;
    }
  }
}