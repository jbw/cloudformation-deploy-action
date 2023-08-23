# AWS Cloudformation Deploy

## Testing

### Create .env file

```sh
cp .env.template .env
```

### Spin up LocalStack

```sh
docker run --rm -it -p 4566:4566 -p 4571:4571 localstack/localstack
```

### Run tests

```
npm run test
```
