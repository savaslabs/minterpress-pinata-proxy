import express from "express";
import pinataSDK from "@pinata/sdk";
import fs from "fs";
const cors = require("cors");
const multer = require("multer");
const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.NODE_ENV === "production" ? process.env.PORT : 8080; // default port to listen
const request = require("request");
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
  try {
    const multerReq = req as any;
    const fileName = req.body.title.replace(/\s/g, "-");
    // tests Pinata authentication
    pinata = pinataSDK(req.body.apiKey, req.body.apiSecret);

    await pinata
      .testAuthentication()
      .catch((err: any) => res.status(500).json(JSON.stringify(err)));

    const options: any = {
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          description: req.body.description,
        },
      },
    };

    let url = req.body.wpImageUrl;
    if (!/^https?:\/\//i.test(url)) {
      url = "http:" + url;
    }
    const response = await request(url).pipe(
      fs.createWriteStream(`./uploads/${fileName}`)
    );
    const path = response.path;
    const readableStreamForFile = fs.createReadStream(path);

    const pinnedFile = await pinata.pinFileToIPFS(
      readableStreamForFile,
      options
    );

    const ipfsHash = pinnedFile.IpfsHash;

    if (ipfsHash) {
      // remove file from server
      if (multerReq.file) fs.unlinkSync(path);
      // pins metadata
      const metadata = {
        name: req.body.title,
        description: req.body.description,
        tags: req.body.tags,
        copyNumber: req.body.copyNumber,
        symbol: "TUT",
        artifactUri: `ipfs://${ipfsHash}`,
        displayUri: `ipfs://${ipfsHash}`,
        creators: [req.body.creator],
        decimals: 0,
        thumbnailUri: "https://tezostaquito.io/img/favicon.png",
        is_transferable: true,
        shouldPreferSymbol: false,
      };

      console.log("metadata", metadata);

      const pinnedMetadata = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: "TUT-metadata",
        },
      });

      if (pinnedMetadata.IpfsHash && pinnedMetadata.PinSize > 0) {
        res.status(200).json({
          status: true,
          msg: {
            imageHash: ipfsHash,
            metadataHash: pinnedMetadata.IpfsHash,
          },
        });
      } else {
        res
          .status(500)
          .json({ status: false, msg: "metadata were not pinned" });
      }
    } else {
      res.status(500).json({ status: false, msg: "file was not pinned" });
    }
  } catch (err) {
    res.status(500).json({ status: false, msg: err });
  }
});

// starts the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
