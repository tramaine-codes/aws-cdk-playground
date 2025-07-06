import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as es from 'aws-cdk-lib/aws-opensearchservice';
import type { Construct } from 'constructs';
import type { Environment } from '../infrastructure/environment/environment.js';

interface OpenSearchStackProps extends cdk.StackProps {
  readonly environment: Environment;
}

export class OpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OpenSearchStackProps) {
    super(scope, id, props);

    const {
      environment: { openSearchMasterUsername: masterUserName },
    } = props;
    const domain = new es.Domain(this, 'Domain', {
      capacity: {
        dataNodes: 2,
        dataNodeInstanceType: 't3.small.search',
        masterNodeInstanceType: 't3.small.search',
      },
      ebs: {
        volumeSize: 20,
        volumeType: ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
      },
      enableVersionUpgrade: true,
      enforceHttps: true,
      encryptionAtRest: {
        enabled: true,
      },
      fineGrainedAccessControl: {
        masterUserName,
      },
      nodeToNodeEncryption: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tlsSecurityPolicy: es.TLSSecurityPolicy.TLS_1_2,
      version: es.EngineVersion.openSearch('2.19'),
      zoneAwareness: {
        availabilityZoneCount: 2,
      },
    });

    domain.addAccessPolicies(
      new iam.PolicyStatement({
        actions: [
          'es:ESHttpDelete',
          'es:ESHttpGet',
          'es:*ESHttpPost',
          'es:ESHttpPut*',
        ],
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        resources: [domain.domainArn, `${domain.domainArn}/*`],
      })
    );
  }
}
