import { Context } from 'aws-lambda';

export const handler = async (
  event: Record<string, unknown>,
  context: Context
) => {
  // eslint-disable-next-line no-console
  console.log(event);

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(context, undefined, 2));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ status: 'OK', message: 'SUCCESS' }),
  };
};
