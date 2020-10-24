import { Rule, Schedule, RuleTargetInput } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';

//Construct enables self destruction of the entire CloudFormation Stack for which it is initialized in
//Inspired by https://dev.to/guneysus/developing-a-self-destructing-cloudformation-stack-2ka2

export interface SelfDestructProps {
  readonly timeToLive: cdk.Duration;
}

export class SelfDestruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: SelfDestructProps) {
    super(scope, id);

    const selfDestructPolicy: iam.PolicyDocument = new iam.PolicyDocument();

    /** define inline policies */
    const selfDestructPolicyStatements: iam.PolicyStatement[] = [
      //temporarily allow ALL
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['*'],
        resources: ['*'],
      }),
    ];

    selfDestructPolicyStatements.forEach((statement: iam.PolicyStatement) =>
      selfDestructPolicy.addStatements(statement),
    );

    const selfDestructRole = new iam.Role(this, 'SelfDestructLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
      inlinePolicies: {
        policy: selfDestructPolicy,
      },
    });

    const selfDestructLambda = new lambda.SingletonFunction(
      this,
      'self-destruct-stack-app',
      {
        uuid: '6024fd94-c050-11ea-b3de-0242ac130004',
        runtime: lambda.Runtime.PYTHON_3_6,
        role: selfDestructRole,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
client = boto3.client('cloudformation')

def handler(event, context):
  print("event['StackName']: "+event['StackName'])
  return client.delete_stack(
    StackName=event['StackName']
  )
            `),
      },
    );

    const rule = new Rule(this, 'SelfDestructRule', {
      schedule: Schedule.rate(props.timeToLive),
    });

    selfDestructLambda.addPermission('allowEventsPermission', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      sourceArn: rule.ruleArn,
    });

    var params = {
      StackName: cdk.Aws.STACK_NAME,
    };

    rule.addTarget(
      new LambdaFunction(selfDestructLambda, {
        event: RuleTargetInput.fromObject(params),
      }),
    );
  }
}