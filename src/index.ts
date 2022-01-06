import express from "express";
import pinataSDK from "@pinata/sdk";
import fs from "fs";
const cors = require("cors");
const multer = require("multer");
const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.NODE_ENV === "production" ? process.env.PORT : 8080; // default port to listen
const http = require("http");
let pinata: any;

const corsOptions = {
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  origin: "*",
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);

// defines a route handler for the default home page
app.get("/", (req, res) => {
  res.send("Hello developers!");
});

// handles minting
app.post("/mint", upload.single("mintImage"), async (req, res) => {
  console.log("Testing Pinata auth.");
  try {
    // tests Pinata authentication
    pinata = pinataSDK(req.body.apiKey, req.body.apiSecret);

    const authenticated = await pinata.testAuthentication();

    if (!authenticated) {
      console.error('Invalid Pinata credentials.')
      return res.send({status: 403, msg: 'Invalid Pinata credentials'});
    }

    // Format the URL.
    let url = req.body.remoteFileUrl;
    if (!/^https?:\/\//i.test(url)) {
      url = "http:" + url;
    }

    // Get the file name and extension from the url.
    const fileName = url.match(/([^\/]*)\/*$/)[1];
    // Get the file extension from the file name.
    const extension = fileName.split(".").pop();

    // Set file minting options.
    const options: any = {
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          description: req.body.description,
        },
      },
    };

    // Set the temporary local file path.
    const path = `./uploads/${fileName}`;

    console.log("Writing file.");
    // Get the file from the remote.
    http.get(url, function (response: any) {
      if (response.statusCode === 200) {
        // Write to local file system.
        const file = fs.createWriteStream(path);
        const stream = response.pipe(file);
        stream.on("finish", () => {
          // Create readableStream as required by Pinata.
          const readableStreamForFile = fs.createReadStream(path);

          console.log("Pinning file.");
          // Pin the file to IPFS.
          pinata
            .pinFileToIPFS(readableStreamForFile, options)
            .then((pinnedFile: any) => {
              // Remove file from local file system.
              try {
                fs.unlinkSync(path);
              } catch (err) {
                console.error(err)
              }

              const ipfsHash = pinnedFile.IpfsHash;

              if (ipfsHash) {
                // Pin the metadata.
                const metadata = {
                  name: req.body.title,
                  description: req.body.description,
                  tags: req.body.tags.split(","),
                  edition: req.body.edition,
                  publishers: [req.body.publisher],
                  symbol: "TUT",
                  artifactUri: `ipfs://${ipfsHash}`,
                  displayUri: `ipfs://${ipfsHash}`,
                  type: extension,
                  minter: req.body.creator,
                  creators: [req.body.creator],
                  decimals: 0,
                  thumbnailUri: "https://tezostaquito.io/img/favicon.png",
                  isTransferable: true,
                  shouldPreferSymbol: false,
                };

                console.log("Pinning metadata:", metadata);

                pinata
                  .pinJSONToIPFS(metadata, {
                    pinataMetadata: {
                      name: "TUT-metadata",
                    },
                  })
                  .then((pinnedMetadata: any) => {
                    if (pinnedMetadata.IpfsHash && pinnedMetadata.PinSize > 0) {
                      console.log("Success!");
                      res.send({
                        status: true,
                        msg: {
                          imageHash: ipfsHash,
                          metadataHash: pinnedMetadata.IpfsHash,
                        },
                      });
                      return;
                    } else {
                      console.error("Error pinning.");
                      return res.send({
                          status: false,
                          msg: "metadata were not pinned",
                        });
                      
                    }
                  });
              }
            })
            .catch((err: any) => {
              return res.send({ status: false, msg: JSON.stringify(err) });
              
            });
        });
      }
    });
  } catch (err) {
    return res.send({ status: false, msg: err });
  }
});

// starts the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

