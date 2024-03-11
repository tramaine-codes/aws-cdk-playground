import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { match } from 'ts-pattern';
import { TodoService } from './application/service/todo-service.js';
import { Config } from './infrastructure/config/config.js';

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const todoService = TodoService.from(new Config());

  return await match(event.httpMethod)
    .with('POST', () => post(event, todoService))
    .otherwise(() => get(event, todoService));
};

const post = (event: APIGatewayEvent, todoService: TodoService) =>
  todoService.create(JSON.parse(event.body ?? '{}')).caseOf({
    Left: () => ({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Internal Server Error' }),
    }),
    Right: (id) => ({
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'Accepted' }),
    }),
  });

const get = (event: APIGatewayEvent, todoService: TodoService) =>
  todoService.read(event.pathParameters?.todoId ?? '').caseOf({
    Left: () => ({
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Internal Server Error' }),
    }),
    Right: (todo) => ({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo, status: 'Processed' }),
    }),
  });
