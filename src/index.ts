import crypto from "crypto";
import axios from "axios";
import aws from "aws-sdk";
import md5 from "md5";
import { spawn, exec } from "child_process";
import fetch from "node-fetch";
import fs from "fs";
import express from "express";
import { config } from "dotenv";
config();
const port = process.env.PORT;

const s3 = new aws.S3({
  endpoint: "nyc3.digitaloceanspaces.com",
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});
const ffprobe = (file) =>
  new Promise((yes, no) => {
    let data = "";
    spawn("sh", [
      "-c",
      `ffprobe -i ${file} -show_entries format=duration -v quiet -of csv="p=0"`
    ])
      .stdout.on("data", (d) => (data += d))
      .on("end", () => yes(parseInt(data)));
  });
const processAudio = (url) => {
  console.log("Starting to process media:", url);
  return new Promise(async (yes, no) => {
    const fileName = crypto.randomBytes(20).toString("hex");
    console.log("Assigned random filename:", fileName);
    console.log("Beginning media download");
    const data = (
      await axios.get(url, {
        responseType: "arraybuffer"
      })
    ).data;
    await fs.promises.writeFile(`/tmp/${fileName}i`, data);
    console.log("Media downloaded");
    console.log("Beginning ffmpeg process");

    const ffmpeg = spawn("ffmpeg", [
      "-i",
      `/tmp/${fileName}i`,
      `/tmp/${fileName}.mp3`
    ]);
    ffmpeg.stderr
      .on("data", (data) => {
        console.log(data.toString());
      })

      .on("error", console.error)
      .on("end", async () => {
        console.log("ffmpeg process finished");

        console.log("Starting Spaces upload");
        const data = await fs.promises.readFile(`/tmp/${fileName}.mp3`);
        const length = await ffprobe(`/tmp/${fileName}.mp3`);
        console.log(length);
        const hash = md5(data);
        let params = {
          Bucket: "freshair",
          ACL: "public-read",
          ContentType: "audio/mpeg"
        };
        console.log("Hash:", hash);
        // let existing = await s3
        //   .listObjectsV2({
        //     Bucket: 'freshair',
        //     Prefix: `processed_media/mp3/${hash}`
        //   })
        //   .promise()
        // if (existing.Contents.length > 0) {
        //   yes({
        //     audio: `https://cdn.freshair.dev/processed_media/mp3/${hash}`
        //   })
        // }
        const dataStream = fs.createReadStream(`/tmp/${fileName}.mp3`);

        await s3
          .putObject({
            ...params,
            Body: dataStream,
            Key: `processed_media/mp3/${hash}`
          })
          .on("httpUploadProgress", (event) => {
            console.log(
              `Uploaded ${Math.round((event.loaded / event.total) * 100)}%`
            );
          })
          .promise();
        // await uploadToZetta(data, name)
        yes({
          audio: `https://cdn.freshair.radio/processed_media/mp3/${hash}`,
          length
        });
      });
  });
};

const app = express();
app.use(express.json());
app.use(async (req, res, next) => {
  const user = await fetch(`https://identity.freshair.radio/user`, {
    headers: {
      authorization: req.headers.authorization
    }
  });
  if (user.status != 200) {
    return res.status(401).json({ error: "Please provide a valid auth token" });
  }
  let json = await user.json();
  req.user = json;
  return next();
});
app.post(`/process`, (req, res) => {
  processAudio(req.body.audio).then((r: object) => {
    console.log(r);
    axios.put(
      req.body.update_url,
      { ...r, published: true },
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json"
        }
      }
    );
  });
  return res.status(200).send();
});
console.log("Listening");
app.listen(port, () => "Server started");
