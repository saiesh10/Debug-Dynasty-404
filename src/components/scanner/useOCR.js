import { useCallback, useState } from 'react'

function sharpenImage(data, width, height) {
  const copy = new Uint8ClampedArray(data)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const center = copy[idx]
      const up = copy[((y - 1) * width + x) * 4]
      const down = copy[((y + 1) * width + x) * 4]
      const left = copy[(y * width + (x - 1)) * 4]
      const right = copy[(y * width + (x + 1)) * 4]
      const sharp = Math.max(0, Math.min(255, center * 3 - (up + down + left + right) * 0.5))
      data[idx] = sharp
      data[idx + 1] = sharp
      data[idx + 2] = sharp
    }
  }
}

function prepareImage(image) {
  if (typeof document === 'undefined' || !image?.width || !image?.height) return image

  const targetWidth = Math.max(image.width, Math.min(2400, Math.round(image.width * 1.5)))
  const scale = targetWidth / image.width
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const imgData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imgData.data

  // Calculate luminance histogram to determine dynamic contrast stretch
  const histogram = new Uint32Array(256)
  const totalPixels = canvas.width * canvas.height
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
    histogram[lum]++
  }

  // Find 2nd and 98th percentile for robust contrast stretch
  let cumulative = 0
  let pLow = 0
  let pHigh = 255
  const lowThresh = totalPixels * 0.02
  const highThresh = totalPixels * 0.98

  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i]
    if (pLow === 0 && cumulative >= lowThresh) pLow = i
    if (cumulative >= highThresh) {
      pHigh = i
      break
    }
  }

  const range = Math.max(1, pHigh - pLow)
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const stretched = Math.max(0, Math.min(255, ((lum - pLow) / range) * 255))
    data[i] = stretched
    data[i + 1] = stretched
    data[i + 2] = stretched
  }

  // Apply subtle edge sharpening to enhance letter/number legibility
  sharpenImage(data, canvas.width, canvas.height)

  context.putImageData(imgData, 0, 0)
  return canvas
}

let cachedWorker = null
let workerInitPromise = null

async function getOCRWorker() {
  if (cachedWorker) return cachedWorker
  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng+hin')
      await worker.setParameters({
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '3',
        user_defined_dpi: '300',
      })
      cachedWorker = worker
      return worker
    })().catch((err) => {
      workerInitPromise = null
      throw err
    })
  }
  return workerInitPromise
}

export function useOCR() {
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [words, setWords] = useState([])
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState(null)

  const recognize = useCallback(async (image) => {
    setIsReading(true)
    setError(null)

    try {
      const worker = await getOCRWorker()
      const processedImage = prepareImage(image)
      const result = await worker.recognize(processedImage)
      const nextText = result?.data?.text || ''
      const nextConfidence = Number(result?.data?.confidence || 0)
      const nextWords = result?.data?.words || []

      console.group?.('[OCR ENGINE LOG]') || console.log('=== [OCR ENGINE LOG] ===')
      console.log('(a) RAW OCR TEXT OUTPUT FROM TESSERACT:\n' + (nextText || '<EMPTY>'))
      console.log('OCR Mean Confidence:', nextConfidence)
      console.log('Detected Word Count:', nextWords.length)
      console.groupEnd?.()

      setText(nextText)
      setConfidence(nextConfidence)
      setWords(nextWords)
      return { text: nextText, confidence: nextConfidence, words: nextWords }
    } catch (recognizeError) {
      const message =
        recognizeError?.message || 'OCR failed. The image may be unsupported, or the worker could not load.'
      setError(message)
      setText('')
      setConfidence(0)
      setWords([])
      return { text: '', confidence: 0, words: [], error: message }
    } finally {
      setIsReading(false)
    }
  }, [])

  return { text, confidence, words, isReading, error, recognize }
}
