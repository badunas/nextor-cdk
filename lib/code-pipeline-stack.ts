import * as cdk from 'aws-cdk-lib'
import { Stack, StackProps } from 'aws-cdk-lib'
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import { SecretValue } from 'aws-cdk-lib'

export class CodePipelineStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: StackProps) {
    super(scope, id, props)

    const githubOwner = 'badunas'
    const githubRepo = 'nextor'
    const githubBranch = 'main'
    const githubToken = SecretValue.secretsManager('github-token') // Store your GitHub token in Secrets Manager

    const sourceOutput = new codepipeline.Artifact()
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      oauthToken: githubToken,
      output: sourceOutput,
    })

    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-x86_64-standard:5.0')
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18.x',
            },
            commands: [
                'npm install',
            ],
          },
          build: {
            commands: ['npm run build'],
          },
        },
        artifacts: {
          'base-directory': 'build',
          files: ['**/*'],
        },
      }),
    })

    // Define the build action
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
    })

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'NextorCodePipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
      ],
    })
  }
}
