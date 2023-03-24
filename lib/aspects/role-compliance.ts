import { IAspect } from 'aws-cdk-lib';
import { CfnRole } from 'aws-cdk-lib/aws-iam';
import { IConstruct } from 'constructs';

export class RoleCompliance implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof CfnRole) {
      node.roleName = `PROJECT_${node.logicalId}-${node.stack.region}`;
    }
  }
}
