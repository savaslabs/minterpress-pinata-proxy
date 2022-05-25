# Minterpress Pinata Proxy

Minterpress Pinata Proxy is an Express app for interfacing with the [Pinata Node SDK](https://docs.pinata.cloud/pinata-node-sdk). [Pinata](https://www.pinata.cloud/) is a cloud service for storing and managing NFT media, and the Pinata Node SDK provides the quickest / easiest path for using Pinata to pin media and metadata to IPFS for minting NFTs.

The goal of this app is to provide a utility for apps without Node backends to utilize Pinata for pinning media to IPFS. This app is based heavily on the approach described by [@claudebarde](https://github.com/claudebarde) in the article [How to mint NFTs on Tezos using Taquito and Pinata](https://medium.com/ecad-labs-inc/how-to-mint-nfts-on-tezos-using-taquito-and-pinata-15a407078495).

## Installation

```
npm install
```

Copy the sample environment file to `.env`

```
cp .env.sample .env
```

## Development & Maintenance

```
npm run dev
```

starts the server on http://localhost:8080 in develop mode with hot reloading.

```
npm run start
```
starts the server on http://localhost:8080 in build mode without hot reloading.

## API Usage

### Pin

- URL: 
    - `/pin`
- Method:
    - `POST`
- URL Params:
    - none
- Data Params:
    This app uses [multer](https://www.npmjs.com/package/multer), an Express middleware for handling `multipart/form-data`. The expected [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) keys are:

    - For Pinata Authentication:
        - `apiKey` - your Pinata API key string generated at https://app.pinata.cloud/keys
        - `apiSecret`- your Pinata API secret string generated at https://app.pinata.cloud/keys
    - For passing file to be pinned:
        - `remoteFileUrl` - the absolute URL to the temporary location of the file to be pinned. We pass the URL instead of uploading the file in order to allow using 3rd-party file upload utilities such as the WordPress's native media upload functionality, Uppy, FilePond, or any other upload utility.
    - For pinning metadata that will be formatted to match [TZIP-21 protocol](https://tzip.tezosagora.org/proposal/tzip-21/):
        - `name` - string
        - `description` - string
        - `tags` - string of tags separated by commas
        - `publisher` - string
        - `creator` - string the wallet address of the creator
        - `attributes` - { name: string; value: string }[]
- Success Response:
    ```
    {
        status: true,
        msg: {
            imageHash: <imageHash: string>,
            metadataHash: <metadataHash: string>,
        },
    }
    ```
- Error Response:
    ```
    {
        status: false,
        msg: <error message>,
    }
    ```

## Deployment

The application includes a Procfile and is ready to be deployed to Heroku. To deploy to Heroku, follow the instructions at [Creating Apps from the CLI](https://devcenter.heroku.com/articles/creating-apps).

***IMPORTANT: Prior to deploying, the 'pluginBaseUrl' variable in the .env file most be updated with the URL plugin will be hosted / making requests from. By default, it will be set to a wildcard * allowing access from anywhere***

### Sample valid .env file values (Make sure URLs DO NOT end in a trailing slash '/')

Wildcard Example (Default):

```
env=local
basePluginUrl=*
```

If the port is not 80, the port should be specified:

```
env=local
basePluginUrl=http://localhost:3000
```

Using a test proxy that's not local running port 80:

```
env=dev
basePluginUrl=http://104.131.119.16
```

Using a test proxy that's not local running port 8000:

```
env=dev
basePluginUrl=http://104.131.119.16:8000
```

Ideally, in production this should would be an HTTPS connection:

```
env=prod
basePluginUrl=https://mymintingwebsite.com
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
