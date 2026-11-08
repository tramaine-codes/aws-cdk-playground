import type { Context } from 'aws-lambda';

export const handler = async (
  event: Record<string, unknown>,
  context: Context
) => {
  // biome-ignore lint/suspicious/noConsole: logs go to CloudWatch
  console.log(event);

  // biome-ignore lint/suspicious/noConsole: logs go to CloudWatch
  console.log(JSON.stringify(context, undefined, 2));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ status: 'OK', message: 'SUCCESS' }),
  };
};
