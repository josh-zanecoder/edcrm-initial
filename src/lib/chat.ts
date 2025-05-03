import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Todo {
  task: string;
  date: string;
}

interface ChatResponse {
  summary: string;
  todos: Todo[];
}

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function chat(prompt: string): Promise<string> {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const conversation: Message[] = [
    {
      role: 'system',
      content: `The current date is ${currentDate}.`
    },
    {
      role: 'system',
      content: 'Make the response convertable to JSON using JSON.parse in JavaScript.'
    },
    {
      role: 'system',
      content: 'Generate a summary of the conversation and a list of tasks (todos) based on the conversation provided. Respond with an object containing two keys: "summary" (a string summarizing the conversation) and "todos" (an array of tasks in the format [{"task": "task description", "date": "YYYY-MM-DD HH:mm"}, ...]). If no date is mentioned in a task, use the current local date and time in California (PST/PDT), formatted as YYYY-MM-DD HH:mm.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversation,
      max_tokens: 1000,
      temperature: 0.3,
      top_p: 0.9,
    });

    const botResponse = response.choices[0].message.content;
    console.log('OpenAI chat response:', botResponse);
    return botResponse || '';
  } catch (error) {
    console.error('Error in chat completion:', error);
    throw error;
  }
}

export function parseTodos(response: string): Todo[] {
  try {
    const trimmedResponse = response.trim();
    const parsedResponse: ChatResponse = JSON.parse(trimmedResponse);
    
    if (parsedResponse.todos && Array.isArray(parsedResponse.todos)) {
      return parsedResponse.todos;
    }
    
    console.error('Invalid todos format received:', response);
    return [];
  } catch (error) {
    console.error('Error parsing todos:', error);
    return [];
  }
} 