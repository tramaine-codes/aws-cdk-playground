export const handler = async (event) => {
  // biome-ignore lint/suspicious/noConsole: logs go to CloudWatch
  console.log('request:', JSON.stringify(event, undefined, 2));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: `Hello, CDK! You've hit ${event.path}\n`,
  };
};
