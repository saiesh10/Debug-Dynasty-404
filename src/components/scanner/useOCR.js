import { useCallback, useState } from 'react'

export function useOCR() {
  const [text, setText] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [words, setWords] = useState([])
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState(null)

  const recognize = useCallback(async (image) => {
    setIsReading(true)
    setError(null)

    let worker
    try {
      worker = await import('tesseract.js').then((module) => module.createWorker('eng'))
      const result = await worker.recognize(image)
      const nextText = result?.data?.text || ''
      const nextConfidence = Number(result?.data?.confidence || 0)
      const nextWords = result?.data?.words || []
      setText(nextText)
      setConfidence(nextConfidence)
      setWords(nextWords)
      return { text: nextText, confidence: nextConfidence, words: nextWords }
    } catch (recognizeError) {
      const message = recognizeError?.message || 'OCR failed. The image may be unsupported, or the worker could not load.'
      setError(message)
      setText('')
      setConfidence(0)
      setWords([])
      return { text: '', confidence: 0, words: [], error: message }
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch {
          // Worker already torn down.
        }
      }
      setIsReading(false)
    }
  }, [])

  return { text, confidence, words, isReading, error, recognize }
}
