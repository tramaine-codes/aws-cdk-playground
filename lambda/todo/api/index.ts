import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Effect, Match, Option } from 'effect';
import { Config } from '../common/infrastructure/config/config.js';
import { TodoService } from './application/service/todo-service.js';

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const todoService = TodoService.from(new Config());

  return await Effect.runPromise(
    Match.value(event.httpMethod).pipe(
      Match.when('POST', () => post(event, todoService)),
      Match.orElse(() => get(event, todoService))
    )
  );
};

const post = ({ body }: APIGatewayEvent, todoService: TodoService) =>
  todoService
    .create(
      JSON.parse(Option.fromNullable(body).pipe(Option.getOrElse(() => '{}')))
    )
    .pipe(
      Effect.match({
        onFailure: () => ({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Internal Server Error' }),
        }),
        onSuccess: (id) => ({
          statusCode: 202,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'Accepted' }),
        }),
      })
    );

const get = ({ pathParameters }: APIGatewayEvent, todoService: TodoService) =>
  todoService
    .read(
      Option.fromNullable(pathParameters).pipe(
        Option.flatMapNullable(({ todoId }) => todoId),
        Option.getOrElse(() => '')
      )
    )
    .pipe(
      Effect.match({
        onFailure: () => ({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Internal Server Error' }),
        }),
        onSuccess: (todo) => ({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ todo, status: 'Processed' }),
        }),
      })
    );
