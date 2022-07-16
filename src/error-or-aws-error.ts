import * as AWS from 'aws-sdk';

export type ErrorOrAwsError = AWS.AWSError | Error;
