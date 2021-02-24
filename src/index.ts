import crypto from "crypto";
import axios from "axios";
import cors from "cors";
import aws from "aws-sdk";
import md5 from "md5";
import { spawn, exec } from "child_process";
import fetch from "node-fetch";
import fs from "fs";
import express from "express";
import { config } from "dotenv";
config();
const port = process.env.PORT;

async function run(slug: string) {
  let { picture } = await fetch(
    `https://api.freshair.radio/public/shows/${slug}`
  ).then((r) => r.json());
  let rss = await fetch(`https://api.freshair.radio/rss/${slug}`).then((r) =>
    r.text()
  );
  console.log(picture);

  const { data, headers } = await axios.get(
    `https://imgproxy.freshair.radio/signature/fill/2000/2000/sm/1/plain/${picture}@jpg`,
    {
      responseType: "arraybuffer"
    }
  );
  let params = {
    Bucket: "freshair",
    ACL: "public-read",
    ContentType: "application/rss+xml"
  };
  await s3
    .putObject({
      ...params,
      ContentType: "image/jpeg",
      Body: data,
      Key: `rssfeed/${slug}.jpg`
    })
    .promise();
  let req = await s3
    .putObject({
      ...params,
      Body: rss,
      Key: `rssfeed/${slug}.xml`
    })
    .promise();
  console.log(req);
}
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
      "-f",
      "mp3",
      "-vn",
      "-ar",
      "44100",
      "-b:a",
      "192k",
      "-af",
      "loudnorm=I=-18:LRA=13:TP=-2",
      "-ac",
      "2",
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
            Key: `processed_media/mp3/${hash}.mp3`
          })
          .on("httpUploadProgress", (event) => {
            console.log(
              `Uploaded ${Math.round((event.loaded / event.total) * 100)}%`
            );
          })
          .promise();
        // await uploadToZetta(data, name)
        yes({
          audio: `https://freshair.nyc3.digitaloceanspaces.com/processed_media/mp3/${hash}.mp3`,
          length
        });
      });
  });
};

const app = express();
app.use(express.json());
app.use(cors());
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
  processAudio(req.body.audio).then(async (r: any) => {
    console.log(r);
    await axios.put(
      req.body.update_url,
      { ...r, published: true },
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("Generating RSS");
    setTimeout(() => run(req.body.show), 500);
  });
  return res.status(200).send();
});
console.log("Listening");
app.listen(port, () => "Server started");
