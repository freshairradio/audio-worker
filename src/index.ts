import crypto from 'crypto'
import axios from 'axios'
import aws from 'aws-sdk'
import md5 from 'md5'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import express from 'express'
const port = process.env.PORT
import { getAudioDurationInSeconds } from 'get-audio-duration'
const s3 = new aws.S3({
  endpoint: 'nyc3.digitaloceanspaces.com',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
})
const processAudio = (url) => {
  console.log('Starting to process media:', url)
  return new Promise(async (yes, no) => {
    const fileName = crypto.randomBytes(20).toString('hex')
    console.log('Assigned random filename:', fileName)
    console.log('Beginning media download')
    const data = (
      await axios.get(url, {
        responseType: 'arraybuffer'
      })
    ).data
    await fs.promises.writeFile(`/tmp/${fileName}i`, data)
    console.log('Media downloaded')
    console.log('Beginning ffmpeg process')

    ffmpeg(`/tmp/${fileName}i`)
      .format('mp3')
      .audioBitrate(128)
      .save(`/tmp/${fileName}`)
      .on('progress', (progress) => {
        console.log('Processing: ' + Math.round(progress.percent) + '% done')
      })

      .on('error', console.error)
      .on('end', async () => {
        console.log('ffmpeg process finished')

        console.log('Starting Spaces upload')
        const data = await fs.promises.readFile(`/tmp/${fileName}`)
        const length = await getAudioDurationInSeconds(`/tmp/${fileName}`)
        const hash = md5(data)
        let params = {
          Bucket: 'freshair',
          ACL: 'public-read',
          ContentType: 'audio/mpeg'
        }
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
        const dataStream = fs.createReadStream(`/tmp/${fileName}`)

        await s3
          .putObject({
            ...params,
            Body: dataStream,
            Key: `processed_media/mp3/${hash}`
          })
          .on('httpUploadProgress', (event) => {
            console.log(
              `Uploaded ${Math.round((event.loaded / event.total) * 100)}%`
            )
          })
          .promise()
        // await uploadToZetta(data, name)
        yes({
          audio: `https://cdn.freshair.radio/processed_media/mp3/${hash}`,
          length
        })
      })
  })
}

const app = express()
app.use(express.json())

app.post(`/process`, (req, res) => {
  processAudio(req.body.audio).then((r: object) => {
    console.log(r)
    axios.put(
      req.body.update_url,
      { meta: { ...r, published: true } },
      {
        headers: {
          Authorization: process.env.SHARED_API_SECRET,
          'Content-Type': 'application/json'
        }
      }
    )
  })
  return res.status(200).send()
})
app.listen(port)
