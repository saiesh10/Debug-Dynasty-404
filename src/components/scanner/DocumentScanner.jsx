import { useCallback, useEffect, useRef, useState } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { useCamera } from '../../context/CameraContext'
import { OCR_FIELD_CONFIDENCE_THRESHOLD } from '../../constants'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import CameraErrorPanel from '../common/CameraErrorPanel'
import { extractFields } from './fieldExtractor'
import ManualCorrectionForm from './ManualCorrectionForm'
import { useOCR } from './useOCR'

function toCitizenRecord(fields) {
  return {
    name: fields.name?.value || '',
    dateOfBirth: fields.dateOfBirth?.value || '',
    idNumber: fields.idNumber?.value || '',
    address: fields.address?.value || '',
  }
}

function emptyFields() {
  return {
    name: { value: '', confidence: 0 },
    dateOfBirth: { value: '', confidence: 0 },
    idNumber: { value: '', confidence: 0 },
    address: { value: '', confidence: 0 },
  }
}

function needsManualCorrection(fields) {
  return Object.values(fields).some((field) => (field?.confidence || 0) < OCR_FIELD_CONFIDENCE_THRESHOLD)
}

function DocumentScanner() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const { updateCitizenData } = useCitizen()
  const { navigateTo, goHome } = useNavigation()
  const { stream, errorInfo, startCamera, stopCamera, retryCamera, shouldOfferButtonFallback } = useCamera()
  const { recognize, isReading, error: ocrError } = useOCR()
  const [draftFields, setDraftFields] = useState(null)
  const [showCorrection, setShowCorrection] = useState(false)
  const [buttonNavigation, setButtonNavigation] = useState(false)
  const [status, setStatus] = useState('Position an identity document in the frame.')

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return undefined
    video.srcObject = stream
    video.play().catch((err) => console.warn('[camera]', err.name, err.message))
    return undefined
  }, [stream])

  const commitFields = useCallback((fields) => {
    updateCitizenData(toCitizenRecord(fields))
    setShowCorrection(false)
    navigateTo('confirm', null, 'Document details found. Please confirm them.')
  }, [navigateTo, updateCitizenData])

  const runOcrOnImage = useCallback(async (image) => {
    setStatus('Reading the document on this device…')
    const result = await recognize(image)
    if (result.error) {
      setStatus(result.error)
      setDraftFields(emptyFields())
      setShowCorrection(true)
      return
    }

    const fields = extractFields(result.text, result.words)
    setDraftFields(fields)
    if (needsManualCorrection(fields)) {
      setShowCorrection(true)
      setStatus('Some fields need a quick check before we continue.')
      return
    }
    commitFields(fields)
  }, [commitFields, recognize])

  const captureFrame = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      setStatus('Camera is not ready yet. Wait for the preview, or upload a file.')
      return
    }
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    await runOcrOnImage(canvas)
  }, [runOcrOnImage])

  const onUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const image = await createImageBitmap(file)
    const canvas = canvasRef.current
    canvas.width = image.width
    canvas.height = image.height
    canvas.getContext('2d').drawImage(image, 0, 0)
    await runOcrOnImage(canvas)
  }

  const updateDraftField = (key, value) => {
    setDraftFields((previous) => ({
      ...previous,
      [key]: { ...previous[key], value, confidence: 100 },
    }))
  }

  usePrimaryAction(showCorrection ? () => draftFields && commitFields(draftFields) : captureFrame)

  return (
    <section className="workspace-panel scanner-panel">
      <span className="eyebrow">Step 1 of 3 · Document scan</span>
      <h2>Scan an identity document</h2>
      <p className="lead">Your details stay on this device. Position the document inside the frame.</p>

      <div className={`scan-frame ${errorInfo ? 'placeholder' : ''}`}>
        {errorInfo && !stream ? (
          <>
            <span>Camera unavailable</span>
            <small>{errorInfo.userMessage}</small>
          </>
        ) : (
          <video ref={videoRef} playsInline muted autoPlay aria-label="Document camera preview" />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden-canvas" />
      <CameraErrorPanel
        errorInfo={errorInfo}
        onRetry={retryCamera}
        onFallback={() => {
          stopCamera()
          setButtonNavigation(true)
          setStatus('Button navigation is on. Enter your details manually to continue.')
        }}
        showFallbackAction={shouldOfferButtonFallback}
      />

      {showCorrection && draftFields ? (
        <ManualCorrectionForm
          fields={draftFields}
          onChange={updateDraftField}
          onConfirm={() => commitFields(draftFields)}
          onCancel={() => {
            setShowCorrection(false)
            setStatus('Position an identity document in the frame.')
          }}
        />
      ) : (
        <>
          <p className="scan-status">{isReading ? 'Reading…' : status}</p>
          {ocrError && <p className="error-banner">{ocrError}</p>}
          <div className="action-row">
            <button className="primary-button" type="button" onClick={captureFrame} disabled={isReading || !stream}>
              Capture document
            </button>
            <label className="secondary-button upload-button">
              Upload photo
              <input type="file" accept="image/*" onChange={onUpload} hidden />
            </label>
            <button className="secondary-button" type="button" onClick={() => {
              setDraftFields(emptyFields())
              setShowCorrection(true)
            }}>
              Enter details manually
            </button>
            {buttonNavigation && <span className="scan-status">Use the buttons below to continue without camera access.</span>}
            <button className="secondary-button" type="button" onClick={goHome}>Back</button>
          </div>
        </>
      )}
    </section>
  )
}

export default DocumentScanner
