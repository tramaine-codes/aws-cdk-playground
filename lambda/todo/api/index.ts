import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Maybe } from 'purify-ts';
import { match } from 'ts-pattern';
import { Config } from '../common/infrastructure/config/config.js';
import { TodoService } from './application/service/todo-service.js';

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const todoService = TodoService.from(new Config());

  return await match(event.httpMethod)
    .with('POST', () => post(event, todoService))
    .otherwise(() => get(event, todoService));
};

const post = ({ body }: APIGatewayEvent, todoService: TodoService) =>
  todoService
    .create(JSON.parse(Maybe.fromNullable(body).orDefault('{}')))
    .caseOf({
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

const get = ({ pathParameters }: APIGatewayEvent, todoService: TodoService) =>
  todoService
    .read(
      Maybe.fromNullable(pathParameters)
        .chainNullable(({ todoId }) => todoId)
        .orDefault('')
    )
    .caseOf({
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
