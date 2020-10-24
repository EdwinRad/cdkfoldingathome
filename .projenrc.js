const { AwsCdkConstructLibrary } = require('projen');

const project = new AwsCdkConstructLibrary({
  authorAddress: "edwin@boring-voice.com",
  authorName: "Edwin",
  cdkVersion: "1.70.0",
  name: "cdkfoldingathome",
  repository: "https://github.com/edwin.radtke/foldingathome.git",
  cdkDependencies: [
    "@aws-cdk/aws-ec2",
    "@aws-cdk/aws-iam",
    "@aws-cdk/aws-autoscaling",
    "@aws-cdk/core",
    "@aws-cdk/aws-lambda",
    "@aws-cdk/aws-iam",
    "@aws-cdk/aws-events",
    "@aws-cdk/aws-events-targets",
  ],
});
project.addScript("compile", "jsii --silence-warnings=reserved-word --no-fix-peer-dependencies");
project.synth();
