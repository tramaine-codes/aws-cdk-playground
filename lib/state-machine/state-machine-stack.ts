import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';

export class StateMachineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const choice = new sfn.Choice(this, 'What color is it?');

    const foo = new sfn.Pass(this, 'Foo', { stateName: 'Foo' });
    const bar = new sfn.Pass(this, 'Bar', { stateName: 'Bar' });
    const baz = new sfn.Pass(this, 'Baz', { stateName: 'Baz' });

    const parallel = new sfn.Parallel(this, 'Parallel', {
      stateName: 'Parallel',
    })
      .branch(foo)
      .branch(choice);

    choice.when(
      sfn.Condition.stringEquals('$.action', 'create'),
      bar.next(baz)
    );
    choice.otherwise(baz);

    // Use .afterwards() to join all possible paths back together and continue
    // choice.afterwards().next(baz);

    new sfn.StateMachine(this, 'StateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(parallel),
      timeout: cdk.Duration.minutes(5),
      comment: 'a super cool state machine',
    });
  }
}
